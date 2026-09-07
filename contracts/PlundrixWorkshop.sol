// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.17 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IPlundrixGameRoster {
    function getGameInfo(
        uint256 gameID
    ) external view returns (uint8, uint256, uint256, uint256, address);

    function getPlayerAddress(
        uint256 gameID,
        uint256 playerIndex
    ) external view returns (address);
}

/**
 * @title PlundrixWorkshop
 * @notice Onchain, non-transferable gadget crafting and match loadouts for Plundrix.
 * @dev Blueprint metadata is deterministic: 10 chassis x 10 finishes x 12 calibrations.
 *      Cosmetic variants never change the protocol attached to their chassis.
 */
contract PlundrixWorkshop is
    Initializable,
    AccessControlEnumerableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public constant BLUEPRINT_COUNT = 1_200;
    uint256 public constant CHASSIS_COUNT = 10;
    uint256 public constant FINISH_COUNT = 10;
    uint256 public constant CALIBRATION_COUNT = 12;
    uint256 public constant MATERIAL_COUNT = 6;

    enum GadgetProtocol {
        NONE,
        PRECISION_KIT,
        SIGNAL_SCANNER,
        FIREWALL
    }

    enum BlueprintRarity {
        FIELD,
        TUNED,
        RARE,
        MASTERWORK
    }

    address private _game;
    mapping(address => uint256[6]) private _materialBalances;
    mapping(address => mapping(uint256 => bool)) private _craftedBlueprints;
    mapping(address => uint256[]) private _craftedBlueprintLists;
    mapping(address => uint256) private _equippedBlueprints;
    mapping(address => uint256) private _craftedCounts;
    mapping(uint256 => mapping(address => uint256)) private _gameBlueprints;
    mapping(uint256 => mapping(address => bool)) private _gameGadgetReady;
    mapping(uint256 => mapping(address => bool)) private _matchSettled;

    event BlueprintCrafted(
        address indexed operator,
        uint256 indexed blueprintID,
        uint8 chassis,
        uint8 finish,
        uint8 calibration,
        uint256 timeStamp
    );
    event BlueprintEquipped(
        address indexed operator,
        uint256 indexed blueprintID,
        GadgetProtocol protocol,
        uint256 timeStamp
    );
    event BlueprintReclaimed(
        address indexed operator,
        uint256 indexed blueprintID,
        uint256[6] refunds,
        uint256 timeStamp
    );
    event GameLoadoutLocked(
        uint256 indexed gameID,
        address indexed operator,
        uint256 indexed blueprintID,
        GadgetProtocol protocol,
        uint256 timeStamp
    );
    event GadgetConsumed(
        uint256 indexed gameID,
        address indexed operator,
        uint256 indexed blueprintID,
        GadgetProtocol protocol,
        uint256 round,
        uint256 timeStamp
    );
    event SalvageAwarded(
        uint256 indexed gameID,
        address indexed operator,
        uint8 indexed material,
        uint256 amount,
        bool winner,
        uint256 timeStamp
    );

    modifier onlyGame() {
        require(msg.sender == _game, "Only Plundrix game");
        _;
    }

    modifier validBlueprint(uint256 blueprintID) {
        require(
            blueprintID > 0 && blueprintID <= BLUEPRINT_COUNT,
            "Invalid blueprint"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address gameAddress,
        address defaultAdmin,
        address upgrader
    ) external initializer {
        require(gameAddress != address(0), "Game required");
        require(defaultAdmin != address(0), "Default admin required");
        require(upgrader != address(0), "Upgrader required");

        __AccessControlEnumerable_init();
        __UUPSUpgradeable_init();

        _game = gameAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, upgrader);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    function game() external view returns (address) {
        return _game;
    }

    function decodeBlueprint(
        uint256 blueprintID
    )
        public
        pure
        validBlueprint(blueprintID)
        returns (uint8 chassis, uint8 finish, uint8 calibration)
    {
        uint256 value = blueprintID - 1;
        chassis = uint8(value / (FINISH_COUNT * CALIBRATION_COUNT));
        value %= FINISH_COUNT * CALIBRATION_COUNT;
        finish = uint8(value / CALIBRATION_COUNT);
        calibration = uint8(value % CALIBRATION_COUNT);
    }

    function blueprintProtocol(
        uint256 blueprintID
    ) public pure validBlueprint(blueprintID) returns (GadgetProtocol) {
        (uint8 chassis, , ) = decodeBlueprint(blueprintID);
        if (chassis == 0 || chassis == 3 || chassis == 7) {
            return GadgetProtocol.PRECISION_KIT;
        }
        if (chassis == 1 || chassis == 4 || chassis == 8 || chassis == 9) {
            return GadgetProtocol.SIGNAL_SCANNER;
        }
        return GadgetProtocol.FIREWALL;
    }

    function blueprintRarity(
        uint256 blueprintID
    ) public pure validBlueprint(blueprintID) returns (BlueprintRarity) {
        (uint8 chassis, uint8 finish, uint8 calibration) = decodeBlueprint(
            blueprintID
        );
        uint256 roll = (uint256(chassis) * 37 +
            uint256(finish) * 19 +
            uint256(calibration) * 11 +
            17) % 100;
        if (roll < 56) return BlueprintRarity.FIELD;
        if (roll < 82) return BlueprintRarity.TUNED;
        if (roll < 95) return BlueprintRarity.RARE;
        return BlueprintRarity.MASTERWORK;
    }

    function getBlueprintRecipe(
        uint256 blueprintID
    ) public pure validBlueprint(blueprintID) returns (uint256[6] memory costs) {
        (uint8 chassis, uint8 finish, uint8 calibration) = decodeBlueprint(
            blueprintID
        );
        BlueprintRarity rarity = blueprintRarity(blueprintID);
        uint256 multiplier = rarity == BlueprintRarity.FIELD
            ? 100
            : rarity == BlueprintRarity.TUNED
            ? 135
            : rarity == BlueprintRarity.RARE
            ? 175
            : 225;
        uint8[10] memory finishMaterials = [
            uint8(0),
            1,
            2,
            3,
            4,
            5,
            3,
            1,
            2,
            0
        ];
        uint8 primary = finishMaterials[finish];
        uint8 secondary = uint8((uint256(chassis) + calibration) % MATERIAL_COUNT);
        uint8 specialist = uint8((uint256(finish) * 2 + calibration + 3) % MATERIAL_COUNT);

        costs[primary] += _scaledCost(3 + (calibration % 3), multiplier);
        costs[secondary] += _scaledCost(2 + (chassis % 3), multiplier);
        if (rarity != BlueprintRarity.FIELD || specialist != primary) {
            costs[specialist] += _scaledCost(1 + (finish % 2), multiplier);
        }
    }

    function craftBlueprint(
        uint256 blueprintID
    ) external validBlueprint(blueprintID) {
        require(!_isStarterBlueprint(blueprintID), "Starter already owned");
        require(!_craftedBlueprints[msg.sender][blueprintID], "Already crafted");
        uint256[6] memory costs = getBlueprintRecipe(blueprintID);
        for (uint8 material = 0; material < MATERIAL_COUNT; material++) {
            require(
                _materialBalances[msg.sender][material] >= costs[material],
                "Insufficient salvage"
            );
        }
        for (uint8 material = 0; material < MATERIAL_COUNT; material++) {
            _materialBalances[msg.sender][material] -= costs[material];
        }
        _craftedBlueprints[msg.sender][blueprintID] = true;
        _craftedBlueprintLists[msg.sender].push(blueprintID);
        _craftedCounts[msg.sender]++;
        (uint8 chassis, uint8 finish, uint8 calibration) = decodeBlueprint(
            blueprintID
        );
        emit BlueprintCrafted(
            msg.sender,
            blueprintID,
            chassis,
            finish,
            calibration,
            block.timestamp
        );
    }

    /**
     * @notice Break a custom build back into half of its recipe materials.
     * @dev Starter blueprints are permanent. Rounded-up refunds ensure every
     *      material shown in a recipe remains tangible when reclaimed.
     */
    function reclaimBlueprint(
        uint256 blueprintID
    ) external validBlueprint(blueprintID) returns (uint256[6] memory refunds) {
        require(!_isStarterBlueprint(blueprintID), "Starter build is permanent");
        require(_craftedBlueprints[msg.sender][blueprintID], "Blueprint not owned");

        delete _craftedBlueprints[msg.sender][blueprintID];
        _craftedCounts[msg.sender]--;

        uint256[] storage crafted = _craftedBlueprintLists[msg.sender];
        for (uint256 index = 0; index < crafted.length; index++) {
            if (crafted[index] != blueprintID) continue;
            crafted[index] = crafted[crafted.length - 1];
            crafted.pop();
            break;
        }

        if (_equippedBlueprints[msg.sender] == blueprintID) {
            _equippedBlueprints[msg.sender] = 0;
            emit BlueprintEquipped(
                msg.sender,
                0,
                GadgetProtocol.NONE,
                block.timestamp
            );
        }

        uint256[6] memory costs = getBlueprintRecipe(blueprintID);
        for (uint8 material = 0; material < MATERIAL_COUNT; material++) {
            if (costs[material] == 0) continue;
            refunds[material] = (costs[material] + 1) / 2;
            _materialBalances[msg.sender][material] += refunds[material];
        }

        emit BlueprintReclaimed(
            msg.sender,
            blueprintID,
            refunds,
            block.timestamp
        );
    }

    function equipBlueprint(uint256 blueprintID) external {
        if (blueprintID != 0) {
            require(ownsBlueprint(msg.sender, blueprintID), "Blueprint not owned");
        }
        _equippedBlueprints[msg.sender] = blueprintID;
        GadgetProtocol protocol = blueprintID == 0
            ? GadgetProtocol.NONE
            : blueprintProtocol(blueprintID);
        emit BlueprintEquipped(
            msg.sender,
            blueprintID,
            protocol,
            block.timestamp
        );
    }

    function lockLoadout(
        uint256 gameID,
        address operator
    ) external onlyGame returns (uint256 blueprintID, GadgetProtocol protocol) {
        return _lockLoadout(gameID, operator);
    }

    function lockGameLoadouts(uint256 gameID) external onlyGame {
        (, , uint256 playerCount, , ) = IPlundrixGameRoster(_game).getGameInfo(
            gameID
        );
        for (uint256 i = 1; i <= playerCount; i++) {
            _lockLoadout(
                gameID,
                IPlundrixGameRoster(_game).getPlayerAddress(gameID, i)
            );
        }
    }

    function _lockLoadout(
        uint256 gameID,
        address operator
    ) internal returns (uint256 blueprintID, GadgetProtocol protocol) {
        blueprintID = _equippedBlueprints[operator];
        protocol = blueprintID == 0
            ? GadgetProtocol.NONE
            : blueprintProtocol(blueprintID);
        _gameBlueprints[gameID][operator] = blueprintID;
        _gameGadgetReady[gameID][operator] = blueprintID != 0;
        emit GameLoadoutLocked(
            gameID,
            operator,
            blueprintID,
            protocol,
            block.timestamp
        );
    }

    function consumeGadget(
        uint256 gameID,
        address operator,
        uint8 expectedProtocol,
        uint256 round
    ) external onlyGame returns (bool consumed) {
        return _consumeGadget(gameID, operator, expectedProtocol, round);
    }

    /**
     * @notice Resolve and consume one of ten chassis signatures.
     * @dev Finish, calibration, and rarity remain cosmetic/crafting identity.
     *      Signature is the zero-based chassis index; strength is zero when
     *      the equipped chassis is not eligible in the supplied game state.
     */
    function consumeGadgetEffect(
        uint256 gameID,
        address operator,
        uint8 expectedProtocol,
        uint256 round,
        uint256 tools,
        uint256 locksCracked
    ) external onlyGame returns (uint8 signature, uint8 strength) {
        if (!_gameGadgetReady[gameID][operator]) return (0, 0);
        uint256 blueprintID = _gameBlueprints[gameID][operator];
        GadgetProtocol protocol = blueprintProtocol(blueprintID);
        if (uint8(protocol) != expectedProtocol) return (0, 0);
        (signature, , ) = decodeBlueprint(blueprintID);

        if (signature == 0) strength = 10;
        else if (signature == 1) strength = 20;
        else if (signature == 2 || signature == 5 || signature == 6) strength = 1;
        else if (signature == 3 && tools > 0) strength = 18;
        else if (signature == 4 && round >= 3) strength = 26;
        else if (signature == 7 && locksCracked == 0) strength = 14;
        else if (signature == 8 && tools < 5) strength = 12;
        else if (signature == 9) strength = 10;

        if (strength == 0) return (signature, 0);
        _consumeGadget(gameID, operator, expectedProtocol, round);
    }

    function _consumeGadget(
        uint256 gameID,
        address operator,
        uint8 expectedProtocol,
        uint256 round
    ) internal returns (bool consumed) {
        if (!_gameGadgetReady[gameID][operator]) return false;
        uint256 blueprintID = _gameBlueprints[gameID][operator];
        GadgetProtocol protocol = blueprintProtocol(blueprintID);
        if (uint8(protocol) != expectedProtocol) return false;
        _gameGadgetReady[gameID][operator] = false;
        emit GadgetConsumed(
            gameID,
            operator,
            blueprintID,
            protocol,
            round,
            block.timestamp
        );
        return true;
    }

    function settleMatch(
        uint256 gameID,
        uint256 rounds,
        address operator,
        bool winner,
        uint256 entropy
    ) external onlyGame returns (uint256[6] memory drops) {
        return _settleMatch(gameID, rounds, operator, winner, entropy);
    }

    function settleGame(
        uint256 gameID,
        uint256 rounds,
        address winner,
        uint256 entropy
    ) external onlyGame {
        (, , uint256 playerCount, , ) = IPlundrixGameRoster(_game).getGameInfo(
            gameID
        );
        for (uint256 i = 1; i <= playerCount; i++) {
            address operator = IPlundrixGameRoster(_game).getPlayerAddress(
                gameID,
                i
            );
            _settleMatch(
                gameID,
                rounds,
                operator,
                operator == winner,
                entropy
            );
        }
    }

    function _settleMatch(
        uint256 gameID,
        uint256 rounds,
        address operator,
        bool winner,
        uint256 entropy
    ) internal returns (uint256[6] memory drops) {
        require(!_matchSettled[gameID][operator], "Match already settled");
        _matchSettled[gameID][operator] = true;

        uint256 roll = uint256(
            keccak256(abi.encodePacked(gameID, rounds, operator, entropy))
        );
        uint8 first = uint8(roll % MATERIAL_COUNT);
        uint8 second = uint8((roll + rounds + uint160(operator)) % MATERIAL_COUNT);
        drops[first] = winner ? 5 : 3;
        drops[second] += winner ? 3 : 2;

        for (uint8 material = 0; material < MATERIAL_COUNT; material++) {
            if (drops[material] == 0) continue;
            _materialBalances[operator][material] += drops[material];
            emit SalvageAwarded(
                gameID,
                operator,
                material,
                drops[material],
                winner,
                block.timestamp
            );
        }
    }

    function ownsBlueprint(
        address operator,
        uint256 blueprintID
    ) public view validBlueprint(blueprintID) returns (bool) {
        return
            _isStarterBlueprint(blueprintID) ||
            _craftedBlueprints[operator][blueprintID];
    }

    function getWorkshopState(
        address operator
    )
        external
        view
        returns (
            uint256 equippedBlueprint,
            uint256 craftedCount,
            uint256[6] memory materialBalances
        )
    {
        return (
            _equippedBlueprints[operator],
            _craftedCounts[operator],
            _materialBalances[operator]
        );
    }

    function getCraftedBlueprints(
        address operator
    ) external view returns (uint256[] memory) {
        return _craftedBlueprintLists[operator];
    }

    function getGameLoadout(
        uint256 gameID,
        address operator
    ) external view returns (uint256 blueprintID, bool ready) {
        return (
            _gameBlueprints[gameID][operator],
            _gameGadgetReady[gameID][operator]
        );
    }

    function matchSettled(
        uint256 gameID,
        address operator
    ) external view returns (bool) {
        return _matchSettled[gameID][operator];
    }

    function _isStarterBlueprint(
        uint256 blueprintID
    ) internal pure returns (bool) {
        return blueprintID == 1 || blueprintID == 121 || blueprintID == 241;
    }

    function _scaledCost(
        uint256 base,
        uint256 multiplier
    ) internal pure returns (uint256) {
        return (base * multiplier + 99) / 100;
    }

    uint256[41] private __gap;
}
