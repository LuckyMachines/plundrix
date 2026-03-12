// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.17 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PlundrixGame
 * @notice A single-zone heist game where 2-4 rival operatives compete to crack a vault with 5 locks.
 *         Each round, players choose PICK, SEARCH, or SABOTAGE. First to crack all 5 locks wins.
 *         Supports standalone play plus optional autoloop + external entropy integrations.
 */
contract PlundrixGame is
    Initializable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using Counters for Counters.Counter;

    // --- Roles ---
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");
    bytes32 public constant AUTO_RESOLVER_ROLE = keccak256("AUTO_RESOLVER_ROLE");
    bytes32 public constant RANDOMIZER_ROLE = keccak256("RANDOMIZER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // --- Constants ---
    uint256 public constant TOTAL_LOCKS = 5;
    uint256 public constant MAX_TOOLS = 5;
    uint256 public constant MAX_GAME_PLAYERS = 4;
    uint256 public constant MIN_GAME_PLAYERS = 2;
    uint256 public constant ROUND_TIMEOUT = 5 minutes;
    uint256 public constant MAX_AUTO_RESOLVE_DELAY = 1 days;
    uint256 public constant FEE_BPS = 200;
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10_000;

    // --- Enums ---
    enum Action {
        NONE,
        PICK,
        SEARCH,
        SABOTAGE
    }

    enum GameMode {
        FREE,
        STAKES
    }

    enum GameState {
        OPEN,
        ACTIVE,
        COMPLETE
    }

    enum OutcomeReason {
        NONE,
        PICK_SUCCESS,
        PICK_FAILED_STUNNED,
        PICK_FAILED_ROLL,
        SEARCH_SUCCESS,
        SEARCH_FAILED_ROLL,
        SEARCH_FAILED_MAX_TOOLS,
        SABOTAGE_FAILED_INVALID_TARGET,
        SABOTAGE_SUCCESS_STEAL,
        SABOTAGE_SUCCESS_STUN_ONLY,
        SABOTAGE_SUCCESS_NO_TOOL,
        NO_SUBMISSION
    }

    // --- Structs ---
    struct PlayerState {
        address addr;
        uint256 locksCracked;
        uint256 tools;
        bool stunned;
        bool registered;
    }

    struct PendingAction {
        Action action;
        address sabotageTarget;
        bool submitted;
    }

    struct GameInfo {
        GameState state;
        uint256 currentRound;
        uint256 playerCount;
        uint256 roundStartTime;
        address winner;
    }

    struct LaunchConfiguration {
        address defaultAdmin;
        address gameMaster;
        address pauser;
        address upgrader;
        address autoResolver;
        address randomizer;
        bool startPaused;
    }

    // --- Storage ---
    Counters.Counter private _gameIdCounter;

    mapping(uint256 => GameInfo) private _games;
    mapping(uint256 => mapping(uint256 => PlayerState)) private _players;
    mapping(uint256 => mapping(address => uint256)) private _playerIndex;
    mapping(uint256 => mapping(address => PendingAction)) private _pendingActions;
    mapping(uint256 => mapping(uint256 => uint256)) private _roundEntropy;

    bool private _autoResolveEnabled;
    uint256 private _autoResolveDelay;
    bool private _requireExternalEntropy;
    bool private _feeEnabled;
    address private _feeRecipient;

    mapping(uint256 => GameMode) private _gameMode;
    mapping(uint256 => uint256)  private _entryFee;
    mapping(uint256 => uint256)  private _pot;
    mapping(address => uint256)  private _withdrawable;

    modifier validGame(uint256 gameID) {
        require(_gameExists(gameID), "Game does not exist");
        _;
    }

    // --- Events ---
    event GameCreated(
        uint256 indexed gameID,
        address creator,
        uint256 timeStamp
    );
    event PlayerJoined(
        uint256 indexed gameID,
        address player,
        uint256 playerIndex,
        uint256 timeStamp
    );
    event GameStarted(uint256 indexed gameID, uint256 timeStamp);
    event ActionSubmitted(
        uint256 indexed gameID,
        address player,
        Action action,
        address sabotageTarget,
        uint256 round,
        uint256 timeStamp
    );
    event ActionOutcome(
        uint256 indexed gameID,
        uint256 indexed round,
        address indexed player,
        Action action,
        bool success,
        OutcomeReason reason,
        uint256 locksCracked,
        uint256 tools,
        bool stunned,
        address sabotageTarget,
        uint256 timeStamp
    );
    event RoundResolved(
        uint256 indexed gameID,
        uint256 round,
        uint256 timeStamp
    );
    event RoundAutoResolved(
        uint256 indexed gameID,
        uint256 round,
        address indexed resolver,
        uint256 timeStamp
    );
    event LockCracked(
        uint256 indexed gameID,
        address player,
        uint256 totalCracked,
        uint256 timeStamp
    );
    event ToolFound(
        uint256 indexed gameID,
        address player,
        uint256 totalTools,
        uint256 timeStamp
    );
    event PlayerSabotaged(
        uint256 indexed gameID,
        address attacker,
        address victim,
        uint256 timeStamp
    );
    event PlayerStunned(
        uint256 indexed gameID,
        address player,
        uint256 timeStamp
    );
    event GameWon(
        uint256 indexed gameID,
        address winner,
        uint256 rounds,
        uint256 timeStamp
    );
    event AutomationSettingsUpdated(
        bool autoResolveEnabled,
        uint256 autoResolveDelay,
        bool requireExternalEntropy,
        address updatedBy,
        uint256 timeStamp
    );
    event RoundEntropyProvided(
        uint256 indexed gameID,
        uint256 indexed round,
        uint256 entropy,
        address indexed provider,
        uint256 timeStamp
    );
    event FeeSettingsUpdated(
        bool feeEnabled,
        uint256 feeBps,
        address feeRecipient,
        address updatedBy,
        uint256 timeStamp
    );
    event GameCreatedWithStakes(
        uint256 indexed gameID,
        address creator,
        GameMode mode,
        uint256 entryFee,
        uint256 timeStamp
    );
    event PrizeDistributed(
        uint256 indexed gameID,
        address indexed winner,
        uint256 prizeAmount,
        uint256 feeAmount,
        uint256 timeStamp
    );
    event Withdrawal(
        address indexed account,
        uint256 amount,
        uint256 timeStamp
    );
    event DefaultActionAssigned(
        uint256 indexed gameID,
        uint256 indexed round,
        address indexed player,
        Action action,
        uint256 timeStamp
    );

    // --- Constructor ---

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        LaunchConfiguration memory config
    ) external initializer {
        require(config.defaultAdmin != address(0), "Default admin required");
        require(config.gameMaster != address(0), "Game master required");
        require(config.pauser != address(0), "Pauser required");
        require(config.upgrader != address(0), "Upgrader required");
        require(config.autoResolver != address(0), "Auto resolver required");
        require(config.randomizer != address(0), "Randomizer required");

        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, config.defaultAdmin);
        _grantRole(GAME_MASTER_ROLE, config.gameMaster);
        _grantRole(AUTO_RESOLVER_ROLE, config.autoResolver);
        _grantRole(RANDOMIZER_ROLE, config.randomizer);
        _grantRole(PAUSER_ROLE, config.pauser);
        _grantRole(UPGRADER_ROLE, config.upgrader);

        _autoResolveEnabled = false;
        _autoResolveDelay = ROUND_TIMEOUT;
        _requireExternalEntropy = false;
        _feeEnabled = false;
        _feeRecipient = config.defaultAdmin;

        if (config.startPaused) {
            _pause();
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    // --- Optional Automation / Entropy ---

    /**
     * @notice Configure optional autoloop + external entropy behavior.
     * @dev Existing games keep functioning in standalone mode when disabled.
     */
    function configureAutomation(
        bool autoResolveEnabled,
        uint256 autoResolveDelay,
        bool requireExternalEntropy
    ) external onlyRole(GAME_MASTER_ROLE) {
        if (autoResolveEnabled) {
            require(
                autoResolveDelay >= ROUND_TIMEOUT,
                "Auto delay below round timeout"
            );
            require(
                autoResolveDelay <= MAX_AUTO_RESOLVE_DELAY,
                "Auto delay too high"
            );
        }

        _autoResolveEnabled = autoResolveEnabled;
        _autoResolveDelay = autoResolveEnabled
            ? autoResolveDelay
            : ROUND_TIMEOUT;
        _requireExternalEntropy = requireExternalEntropy;

        emit AutomationSettingsUpdated(
            _autoResolveEnabled,
            _autoResolveDelay,
            _requireExternalEntropy,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Configure the dormant protocol fee for future paid modes.
     * @dev This does not collect any funds by itself. It only preserves fee policy onchain.
     */
    function configureFee(
        bool feeEnabled,
        address feeRecipient
    ) external onlyRole(GAME_MASTER_ROLE) {
        require(feeRecipient != address(0), "Fee recipient required");

        _feeEnabled = feeEnabled;
        _feeRecipient = feeRecipient;

        emit FeeSettingsUpdated(
            _feeEnabled,
            FEE_BPS,
            _feeRecipient,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Injects round entropy that can be sourced by a VRF worker.
     */
    function provideRoundEntropy(
        uint256 gameID,
        uint256 round,
        uint256 entropy
    ) external onlyRole(RANDOMIZER_ROLE) validGame(gameID) whenNotPaused {
        require(round > 0, "Round must be > 0");
        require(entropy > 0, "Entropy must be > 0");
        _roundEntropy[gameID][round] = entropy;
        emit RoundEntropyProvided(
            gameID,
            round,
            entropy,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Resolve any timed-out active games in one call.
     * @dev Intended for an autoloop worker.
     */
    function resolveTimedOutGames(
        uint256[] calldata gameIDs
    )
        external
        onlyRole(AUTO_RESOLVER_ROLE)
        whenNotPaused
        returns (uint256 resolvedCount)
    {
        require(_autoResolveEnabled, "Auto resolve disabled");
        for (uint256 i = 0; i < gameIDs.length; i++) {
            if (_canAutoResolve(gameIDs[i])) {
                _resolveRoundInternal(gameIDs[i], true);
                resolvedCount++;
            }
        }
    }

    // --- Game Lifecycle ---

    /**
     * @notice Create a new game. Anyone can create a game.
     * @return gameID The ID of the newly created game.
     */
    function createGame() external whenNotPaused returns (uint256 gameID) {
        _gameIdCounter.increment();
        gameID = _gameIdCounter.current();

        _games[gameID].state = GameState.OPEN;

        emit GameCreated(gameID, msg.sender, block.timestamp);
    }

    /**
     * @notice Create a game with a specific mode and optional entry fee.
     * @param mode FREE or STAKES.
     * @param entryFee Per-player entry fee in wei (must be 0 for FREE).
     * @return gameID The ID of the newly created game.
     */
    function createGame(GameMode mode, uint256 entryFee) external whenNotPaused returns (uint256 gameID) {
        if (mode == GameMode.STAKES) {
            require(entryFee > 0, "Stakes game requires entry fee");
            require(_feeEnabled, "Fee system not enabled");
            require(_feeRecipient != address(0), "Fee recipient not set");
        } else {
            require(entryFee == 0, "Free game cannot have entry fee");
        }
        _gameIdCounter.increment();
        gameID = _gameIdCounter.current();
        _games[gameID].state = GameState.OPEN;
        _gameMode[gameID] = mode;
        _entryFee[gameID] = entryFee;
        emit GameCreated(gameID, msg.sender, block.timestamp);
        if (mode == GameMode.STAKES) {
            emit GameCreatedWithStakes(gameID, msg.sender, mode, entryFee, block.timestamp);
        }
    }

    /**
     * @notice Register the caller as a player in an open game.
     * @param gameID The game to join.
     */
    function registerPlayer(
        uint256 gameID
    ) external payable validGame(gameID) whenNotPaused {
        GameInfo storage game = _games[gameID];
        require(game.state == GameState.OPEN, "Game not open for registration");
        require(game.playerCount < MAX_GAME_PLAYERS, "Game is full");
        require(_playerIndex[gameID][msg.sender] == 0, "Already registered");

        if (_gameMode[gameID] == GameMode.STAKES) {
            require(msg.value == _entryFee[gameID], "Incorrect entry fee");
            _pot[gameID] += msg.value;
        } else {
            require(msg.value == 0, "Free game does not accept ETH");
        }

        game.playerCount++;
        uint256 idx = game.playerCount;
        _playerIndex[gameID][msg.sender] = idx;
        _players[gameID][idx] = PlayerState({
            addr: msg.sender,
            locksCracked: 0,
            tools: 0,
            stunned: false,
            registered: true
        });

        emit PlayerJoined(gameID, msg.sender, idx, block.timestamp);
    }

    /**
     * @notice Start a game. Can be called by GAME_MASTER_ROLE or any registered player.
     * @param gameID The game to start.
     */
    function startGame(
        uint256 gameID
    ) external validGame(gameID) whenNotPaused {
        GameInfo storage game = _games[gameID];
        require(game.state == GameState.OPEN, "Game not open");
        bool canStart = hasRole(GAME_MASTER_ROLE, msg.sender) ||
            _playerIndex[gameID][msg.sender] > 0;
        require(canStart, "Not authorized to start");
        require(
            game.playerCount >= MIN_GAME_PLAYERS,
            "Not enough players"
        );

        game.state = GameState.ACTIVE;
        game.currentRound = 1;
        game.roundStartTime = block.timestamp;

        emit GameStarted(gameID, block.timestamp);
    }

    // --- Player Actions ---

    /**
     * @notice Submit an action for the current round.
     * @param gameID The game ID.
     * @param action The action to perform (PICK, SEARCH, or SABOTAGE).
     * @param sabotageTarget The target player address (only used for SABOTAGE, ignored otherwise).
     */
    function submitAction(
        uint256 gameID,
        Action action,
        address sabotageTarget
    ) external validGame(gameID) whenNotPaused {
        GameInfo storage game = _games[gameID];
        require(game.state == GameState.ACTIVE, "Game not active");

        uint256 playerIdx = _playerIndex[gameID][msg.sender];
        require(playerIdx > 0, "Not a registered player");
        require(
            !_pendingActions[gameID][msg.sender].submitted,
            "Action already submitted"
        );
        require(
            action == Action.PICK ||
                action == Action.SEARCH ||
                action == Action.SABOTAGE,
            "Invalid action"
        );

        if (action == Action.SABOTAGE) {
            require(
                sabotageTarget != msg.sender,
                "Cannot sabotage yourself"
            );
            require(
                _playerIndex[gameID][sabotageTarget] > 0,
                "Target not in game"
            );
        }

        _pendingActions[gameID][msg.sender] = PendingAction({
            action: action,
            sabotageTarget: sabotageTarget,
            submitted: true
        });

        emit ActionSubmitted(
            gameID,
            msg.sender,
            action,
            sabotageTarget,
            game.currentRound,
            block.timestamp
        );
    }

    // --- Round Resolution ---

    /**
     * @notice Resolve the current round. Can be called by anyone once all actions are in or timeout is reached.
     * @param gameID The game to resolve.
     */
    function resolveRound(
        uint256 gameID
    ) external validGame(gameID) whenNotPaused {
        _resolveRoundInternal(gameID, false);
    }

    function _resolveRoundInternal(
        uint256 gameID,
        bool fromAutoResolver
    ) internal validGame(gameID) {
        GameInfo storage game = _games[gameID];
        require(game.state == GameState.ACTIVE, "Game not active");
        bool timedOut = block.timestamp >= game.roundStartTime + ROUND_TIMEOUT;
        bool autoResolveWindowOpen = block.timestamp >=
            game.roundStartTime + _autoResolveDelay;

        if (fromAutoResolver) {
            require(_autoResolveEnabled, "Auto resolve disabled");
            require(
                timedOut && autoResolveWindowOpen,
                "Auto resolve window not reached"
            );
        } else {
            require(
                allActionsSubmitted(gameID) || timedOut,
                "Not all actions submitted and timeout not reached"
            );
        }

        uint256 round = game.currentRound;
        if (_requireExternalEntropy) {
            require(
                _roundEntropy[gameID][round] > 0,
                "Entropy not ready"
            );
        }

        // Phase 1: Resolve PICK and SEARCH (affected by current stun state)
        for (uint256 i = 1; i <= game.playerCount; i++) {
            PlayerState storage player = _players[gameID][i];
            PendingAction storage pending = _pendingActions[gameID][
                player.addr
            ];

            if (!pending.submitted) {
                if (timedOut) {
                    // AFK player gets auto-PICK (never SABOTAGE — requires target choice)
                    pending.action = Action.PICK;
                    pending.sabotageTarget = address(0);
                    pending.submitted = true;
                    emit DefaultActionAssigned(gameID, round, player.addr, Action.PICK, block.timestamp);
                    // Fall through to normal PICK resolution below
                } else {
                    emit ActionOutcome(
                        gameID,
                        round,
                        player.addr,
                        Action.NONE,
                        false,
                        OutcomeReason.NO_SUBMISSION,
                        player.locksCracked,
                        player.tools,
                        player.stunned,
                        address(0),
                        block.timestamp
                    );
                    continue;
                }
            }

            uint256 rand = _pseudoRandom(gameID, round, i);

            if (pending.action == Action.PICK) {
                (bool success, OutcomeReason reason) = _resolvePick(
                    gameID,
                    player,
                    rand
                );
                emit ActionOutcome(
                    gameID,
                    round,
                    player.addr,
                    pending.action,
                    success,
                    reason,
                    player.locksCracked,
                    player.tools,
                    player.stunned,
                    address(0),
                    block.timestamp
                );
            } else if (pending.action == Action.SEARCH) {
                (bool success, OutcomeReason reason) = _resolveSearch(
                    gameID,
                    player,
                    rand
                );
                emit ActionOutcome(
                    gameID,
                    round,
                    player.addr,
                    pending.action,
                    success,
                    reason,
                    player.locksCracked,
                    player.tools,
                    player.stunned,
                    address(0),
                    block.timestamp
                );
            }
        }

        // Phase 2: Clear existing stuns (stun lasts exactly one round)
        for (uint256 i = 1; i <= game.playerCount; i++) {
            _players[gameID][i].stunned = false;
        }

        // Phase 3: Process SABOTAGE (applies new stuns for next round)
        for (uint256 i = 1; i <= game.playerCount; i++) {
            PlayerState storage player = _players[gameID][i];
            PendingAction storage pending = _pendingActions[gameID][
                player.addr
            ];

            if (pending.submitted && pending.action == Action.SABOTAGE) {
                (
                    bool success,
                    OutcomeReason reason,
                    address target
                ) = _resolveSabotage(gameID, player, pending.sabotageTarget);
                emit ActionOutcome(
                    gameID,
                    round,
                    player.addr,
                    pending.action,
                    success,
                    reason,
                    player.locksCracked,
                    player.tools,
                    player.stunned,
                    target,
                    block.timestamp
                );
            }
        }

        // Phase 4: Clear all pending actions
        for (uint256 i = 1; i <= game.playerCount; i++) {
            delete _pendingActions[gameID][_players[gameID][i].addr];
        }

        emit RoundResolved(gameID, round, block.timestamp);
        if (fromAutoResolver) {
            emit RoundAutoResolved(
                gameID,
                round,
                msg.sender,
                block.timestamp
            );
        }

        // Check for winner
        for (uint256 i = 1; i <= game.playerCount; i++) {
            if (_players[gameID][i].locksCracked >= TOTAL_LOCKS) {
                game.state = GameState.COMPLETE;
                game.winner = _players[gameID][i].addr;
                emit GameWon(
                    gameID,
                    game.winner,
                    round,
                    block.timestamp
                );

                if (_gameMode[gameID] == GameMode.STAKES && _pot[gameID] > 0) {
                    uint256 pot = _pot[gameID];
                    _pot[gameID] = 0;
                    uint256 feeAmount = 0;
                    if (_feeEnabled && _feeRecipient != address(0)) {
                        feeAmount = (pot * FEE_BPS) / BASIS_POINTS_DENOMINATOR;
                        _withdrawable[_feeRecipient] += feeAmount;
                    }
                    _withdrawable[game.winner] += pot - feeAmount;
                    emit PrizeDistributed(gameID, game.winner, pot - feeAmount, feeAmount, block.timestamp);
                }

                return;
            }
        }

        // Advance to next round
        game.currentRound++;
        game.roundStartTime = block.timestamp;
    }

    // --- Internal Resolution ---

    function _resolvePick(
        uint256 gameID,
        PlayerState storage player,
        uint256 rand
    ) internal returns (bool success, OutcomeReason reason) {
        // Stunned players auto-fail picks
        if (player.stunned) {
            return (false, OutcomeReason.PICK_FAILED_STUNNED);
        }

        // Base 40% + 15% per tool, capped at 95%
        uint256 chance = 40 + (player.tools * 15);
        if (chance > 95) {
            chance = 95;
        }

        if (rand < chance) {
            player.locksCracked++;
            emit LockCracked(
                gameID,
                player.addr,
                player.locksCracked,
                block.timestamp
            );
            return (true, OutcomeReason.PICK_SUCCESS);
        }

        return (false, OutcomeReason.PICK_FAILED_ROLL);
    }

    function _resolveSearch(
        uint256 gameID,
        PlayerState storage player,
        uint256 rand
    ) internal returns (bool success, OutcomeReason reason) {
        // 60% success, 30% if stunned
        uint256 chance = player.stunned ? 30 : 60;

        if (rand >= chance) {
            return (false, OutcomeReason.SEARCH_FAILED_ROLL);
        }

        if (player.tools >= MAX_TOOLS) {
            return (false, OutcomeReason.SEARCH_FAILED_MAX_TOOLS);
        }

        player.tools++;
        emit ToolFound(
            gameID,
            player.addr,
            player.tools,
            block.timestamp
        );
        return (true, OutcomeReason.SEARCH_SUCCESS);
    }

    function _resolveSabotage(
        uint256 gameID,
        PlayerState storage attacker,
        address targetAddr
    )
        internal
        returns (bool success, OutcomeReason reason, address target)
    {
        uint256 targetIdx = _playerIndex[gameID][targetAddr];
        if (targetIdx == 0) {
            return (
                false,
                OutcomeReason.SABOTAGE_FAILED_INVALID_TARGET,
                targetAddr
            );
        }
        PlayerState storage targetPlayer = _players[gameID][targetIdx];

        // Stun the target for next round
        targetPlayer.stunned = true;
        emit PlayerSabotaged(
            gameID,
            attacker.addr,
            targetAddr,
            block.timestamp
        );
        emit PlayerStunned(gameID, targetAddr, block.timestamp);

        // Steal a tool if target has any
        if (targetPlayer.tools > 0 && attacker.tools < MAX_TOOLS) {
            targetPlayer.tools--;
            attacker.tools++;
            return (
                true,
                OutcomeReason.SABOTAGE_SUCCESS_STEAL,
                targetAddr
            );
        }

        if (targetPlayer.tools == 0) {
            return (
                true,
                OutcomeReason.SABOTAGE_SUCCESS_NO_TOOL,
                targetAddr
            );
        }

        return (
            true,
            OutcomeReason.SABOTAGE_SUCCESS_STUN_ONLY,
            targetAddr
        );
    }

    function _pseudoRandom(
        uint256 gameID,
        uint256 round,
        uint256 seed
    ) internal view returns (uint256) {
        uint256 entropy = _roundEntropy[gameID][round];
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        gameID,
                        round,
                        block.timestamp,
                        entropy,
                        seed
                    )
                )
            ) % 100;
    }

    // --- View Functions ---

    /**
     * @notice Get the full state of a player in a game.
     * @param gameID The game ID.
     * @param playerAddr The player's address.
     */
    function getPlayerState(
        uint256 gameID,
        address playerAddr
    )
        external
        view
        validGame(gameID)
        returns (
            uint256 locksCracked,
            uint256 tools,
            bool stunned,
            bool registered,
            bool actionSubmitted
        )
    {
        uint256 idx = _playerIndex[gameID][playerAddr];
        if (idx == 0) {
            return (0, 0, false, false, false);
        }
        PlayerState storage player = _players[gameID][idx];
        return (
            player.locksCracked,
            player.tools,
            player.stunned,
            player.registered,
            _pendingActions[gameID][playerAddr].submitted
        );
    }

    /**
     * @notice Get high-level game information.
     * @param gameID The game ID.
     */
    function getGameInfo(
        uint256 gameID
    )
        external
        view
        validGame(gameID)
        returns (
            GameState state,
            uint256 currentRound,
            uint256 playerCount,
            uint256 roundStartTime,
            address winner
        )
    {
        GameInfo storage game = _games[gameID];
        return (
            game.state,
            game.currentRound,
            game.playerCount,
            game.roundStartTime,
            game.winner
        );
    }

    /**
     * @notice Get a player's address by their index in a game.
     * @param gameID The game ID.
     * @param playerIndex The 1-based player index.
     */
    function getPlayerAddress(
        uint256 gameID,
        uint256 playerIndex
    ) external view validGame(gameID) returns (address) {
        return _players[gameID][playerIndex].addr;
    }

    /**
     * @notice Check whether all active players have submitted their actions for the current round.
     * @param gameID The game ID.
     */
    function allActionsSubmitted(
        uint256 gameID
    ) public view validGame(gameID) returns (bool) {
        GameInfo storage game = _games[gameID];
        for (uint256 i = 1; i <= game.playerCount; i++) {
            if (
                !_pendingActions[gameID][_players[gameID][i].addr].submitted
            ) {
                return false;
            }
        }
        return true;
    }

    /**
     * @notice Get the total number of games created.
     */
    function totalGames() external view returns (uint256) {
        return _gameIdCounter.current();
    }

    function getAutomationSettings()
        external
        view
        returns (
            bool autoResolveEnabled,
            uint256 autoResolveDelay,
            bool requireExternalEntropy
        )
    {
        return (
            _autoResolveEnabled,
            _autoResolveDelay,
            _requireExternalEntropy
        );
    }

    function getFeeSettings()
        external
        view
        returns (
            bool feeEnabled,
            uint256 feeBps,
            address feeRecipient
        )
    {
        return (_feeEnabled, FEE_BPS, _feeRecipient);
    }

    function previewFee(
        uint256 amount
    ) external view returns (uint256 feeAmount, uint256 netAmount) {
        if (!_feeEnabled || amount == 0) {
            return (0, amount);
        }

        feeAmount = (amount * FEE_BPS) / BASIS_POINTS_DENOMINATOR;
        netAmount = amount - feeAmount;
    }

    function getRoundEntropy(
        uint256 gameID,
        uint256 round
    ) external view validGame(gameID) returns (uint256) {
        return _roundEntropy[gameID][round];
    }

    function canAutoResolve(
        uint256 gameID
    ) external view validGame(gameID) returns (bool) {
        return _canAutoResolve(gameID);
    }

    function _gameExists(uint256 gameID) internal view returns (bool) {
        return gameID > 0 && gameID <= _gameIdCounter.current();
    }

    function _canAutoResolve(uint256 gameID) internal view returns (bool) {
        if (!_autoResolveEnabled) {
            return false;
        }
        GameInfo storage game = _games[gameID];
        if (game.state != GameState.ACTIVE) {
            return false;
        }
        if (allActionsSubmitted(gameID)) {
            return false;
        }
        if (
            block.timestamp <
            game.roundStartTime + _autoResolveDelay
        ) {
            return false;
        }
        if (
            _requireExternalEntropy &&
            _roundEntropy[gameID][game.currentRound] == 0
        ) {
            return false;
        }
        return true;
    }

    // --- Withdraw & Stakes View ---

    function withdraw() external {
        uint256 amount = _withdrawable[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        _withdrawable[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    function withdrawableBalance(address account) external view returns (uint256) {
        return _withdrawable[account];
    }

    function getGameMode(uint256 gameID) external view validGame(gameID)
        returns (GameMode mode, uint256 entryFee, uint256 pot)
    {
        return (_gameMode[gameID], _entryFee[gameID], _pot[gameID]);
    }

    uint256[44] private __gap;
}
