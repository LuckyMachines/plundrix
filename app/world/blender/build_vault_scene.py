"""Build and render the canonical Plundrix Nightfall Vault.

Run through `npm run world:build`. The scene is procedural so scale, camera,
materials, state variants, and render passes remain reproducible.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


STATES = {
    "preparing": {"locks": 0, "route": "pick", "active": False, "all_routes": False, "breached": False, "affected": None},
    "choose-pick": {"locks": 0, "route": "pick", "active": True, "all_routes": False, "breached": False, "affected": None},
    "simultaneous-reveal": {"locks": 2, "route": "search", "active": True, "all_routes": True, "breached": False, "affected": None},
    "sabotage-impact": {"locks": 3, "route": "sabotage", "active": True, "all_routes": False, "breached": False, "affected": 2},
    "vault-breach": {"locks": 5, "route": "pick", "active": True, "all_routes": False, "breached": True, "affected": None},
}

COLORS = {
    "black": "0A0A0F",
    "indigo": "1A1A2E",
    "brass": "C4956A",
    "amber": "E8B078",
    "blue": "66C4D2",
    "green": "40A080",
    "red": "F06A6A",
}


def arguments() -> argparse.Namespace:
    raw = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--blend-path", required=True)
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=800)
    return parser.parse_args(raw)


def rgba(hex_value: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    value = hex_value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


def material(name: str, color: str, metallic: float = 0.0, roughness: float = 0.5, emission: str | None = None, strength: float = 0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba(color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.18
    if emission:
        emission_input = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        emission_input.default_value = rgba(emission)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def set_emission(mat, color: str, strength: float) -> None:
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    emission_input = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
    emission_input.default_value = rgba(color)
    bsdf.inputs["Emission Strength"].default_value = strength


def tag(obj, role: str, pass_index: int) -> None:
    obj["world_role"] = role
    obj.pass_index = pass_index


def box(name: str, location, dimensions, mat, role="architecture", pass_index=1, bevel=0.08, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("soft-machined-edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(mat)
    tag(obj, role, pass_index)
    return obj


def cylinder(name: str, location, radius, depth, mat, role="mechanism", pass_index=3, vertices=64, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    modifier = obj.modifiers.new("machined-edge", "BEVEL")
    modifier.width = min(radius * 0.035, 0.08)
    modifier.segments = 2
    tag(obj, role, pass_index)
    return obj


def torus(name: str, location, major_radius: float, minor_radius: float, mat, role="mechanism", pass_index=3):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=72,
        minor_segments=12,
        location=location,
        rotation=(math.pi / 2, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    tag(obj, role, pass_index)
    return obj


def beam(name: str, start, end, radius: float, mat, role="architecture", pass_index=1):
    start_v = Vector(start)
    end_v = Vector(end)
    delta = end_v - start_v
    midpoint = (start_v + end_v) / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=delta.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = delta.to_track_quat("Z", "Y")
    obj.data.materials.append(mat)
    tag(obj, role, pass_index)
    return obj


def point_camera(camera, target) -> None:
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def build_scene(scene):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)

    mats = {
        "steel": material("M_BlackenedSteel", COLORS["black"], 0.88, 0.42),
        "indigo": material("M_VaultIndigo", COLORS["indigo"], 0.58, 0.55),
        "brass": material("M_OxidizedBrass", COLORS["brass"], 0.78, 0.48),
        "pick": material("M_PickSignal", "173249", 0.5, 0.3, COLORS["blue"], 0.0),
        "search": material("M_SearchSignal", "18352C", 0.42, 0.34, COLORS["green"], 0.0),
        "sabotage": material("M_SabotageSignal", "3B1B1E", 0.42, 0.34, COLORS["red"], 0.0),
        "breach": material("M_BreachLight", "56361F", 0.1, 0.38, COLORS["amber"], 0.0),
    }

    world = scene.world or bpy.data.worlds.new("NightfallWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("03070B")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.16

    # Room shell and a deliberately simple one-point architectural frame.
    box("Architecture_Floor", (0, 2.0, -0.25), (16, 18, 0.5), mats["steel"], bevel=0.04)
    box("Architecture_BackWall", (0, 9.3, 4.2), (16, 0.45, 8.4), mats["indigo"], bevel=0.04)
    box("Architecture_LeftWall", (-8.0, 2.2, 4.1), (0.4, 14.6, 8.2), mats["steel"], bevel=0.04)
    box("Architecture_RightWall", (8.0, 2.2, 4.1), (0.4, 14.6, 8.2), mats["steel"], bevel=0.04)
    box("Architecture_Ceiling", (0, 2.2, 8.2), (16, 14.6, 0.35), mats["steel"], bevel=0.03)
    for side in (-1, 1):
        for index, y in enumerate((-3.2, 0.0, 3.2, 6.2)):
            beam(f"Architecture_Rib_{side}_{index}", (side * 7.7, y, 0.0), (side * 5.4, y + 1.8, 8.0), 0.12, mats["brass"])
    for x in (-5.0, 0.0, 5.0):
        box(f"Architecture_CeilingLamp_{x}", (x, 3.0, 7.95), (2.2, 0.24, 0.08), mats["breach"], bevel=0.02)
    for index, x in enumerate((-5.2, -2.6, 2.6, 5.2), start=1):
        beam(f"Architecture_FloorSeam_{index}", (x, -5.6, 0.015), (x, 8.5, 0.015), 0.025, mats["brass"])

    # Central physical vault.
    cylinder("Vault_Frame", (0, 9.0, 3.85), 3.05, 0.48, mats["steel"])
    aperture = cylinder("Vault_BreachAperture", (0, 8.84, 3.85), 2.58, 0.18, mats["breach"])
    torus("Vault_OuterBrass", (0, 8.68, 3.85), 2.78, 0.18, mats["brass"])
    door = cylinder("Vault_Door", (0, 8.6, 3.85), 2.5, 0.36, mats["indigo"])
    torus("Vault_InnerRing", (0, 8.36, 3.85), 1.85, 0.11, mats["brass"])
    cylinder("Vault_Hub", (0, 8.08, 3.85), 0.72, 0.42, mats["steel"])
    for spoke_index in range(8):
        angle = (math.pi * 2 * spoke_index) / 8
        beam(
            f"Vault_Spoke_{spoke_index}",
            (math.cos(angle) * 0.78, 8.0, 3.85 + math.sin(angle) * 0.78),
            (math.cos(angle) * 2.2, 8.0, 3.85 + math.sin(angle) * 2.2),
            0.075,
            mats["brass"],
            role="mechanism",
            pass_index=3,
        )

    locks = []
    for index in range(5):
        angle = math.radians(90 - index * 72)
        x = math.cos(angle) * 2.18
        z = 3.85 + math.sin(angle) * 2.18
        lock = cylinder(f"Vault_Lock_{index + 1}", (x, 7.82, z), 0.27, 0.26, mats["brass"], vertices=32)
        locks.append(lock)

    # Three unoccupied rival stations and one foreground player bench.
    stations = []
    for index, x in enumerate((-4.5, 0.0, 4.5), start=1):
        station = box(f"RivalStation_{index}_Body", (x, 3.4 + abs(x) * 0.08, 1.0), (2.3, 1.45, 1.7), mats["indigo"], role="rivals", pass_index=2, bevel=0.13)
        screen = box(f"RivalStation_{index}_Screen", (x, 2.68 + abs(x) * 0.08, 1.72), (1.52, 0.12, 0.72), mats["pick"], role="rivals", pass_index=2, bevel=0.06, rotation=(math.radians(-8), 0, 0))
        stations.append((station, screen))

    box("Workbench_Base", (0, -4.2, 0.65), (11.8, 2.8, 0.72), mats["steel"], role="workbench", pass_index=4, bevel=0.16)
    box("Workbench_Surface", (0, -4.2, 1.15), (11.5, 2.65, 0.3), mats["indigo"], role="workbench", pass_index=4, bevel=0.1, rotation=(math.radians(-5), 0, 0))
    for index, x in enumerate((-3.2, 0.0, 3.2), start=1):
        box(f"Workbench_ActionBay_{index}", (x, -5.35, 1.45), (2.35, 0.12, 0.72), mats[("pick", "search", "sabotage")[index - 1]], role="workbench", pass_index=4, bevel=0.05, rotation=(math.radians(-5), 0, 0))

    rails = {
        "pick": beam("Conduit_Pick", (-3.2, -3.2, 0.25), (-1.0, 7.7, 2.65), 0.075, mats["pick"], role="mechanism", pass_index=3),
        "search": beam("Conduit_Search", (0, -3.2, 0.22), (0, 7.7, 1.55), 0.075, mats["search"], role="mechanism", pass_index=3),
        "sabotage": beam("Conduit_Sabotage", (3.2, -3.2, 0.25), (1.0, 7.7, 2.65), 0.075, mats["sabotage"], role="mechanism", pass_index=3),
    }

    # Warm motivated key, cool vault fill, and restrained breach practical.
    def area_light(name, location, energy, color, size, target):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.color = rgba(color)[:3]
        data.shape = "RECTANGLE"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        point_camera(obj, target)
        return obj

    area_light("Light_WarmKey", (-4.8, -3.5, 7.0), 1150, COLORS["amber"], 4.5, (0, 3.5, 2.5))
    area_light("Light_CoolFill", (5.8, 1.0, 5.5), 850, COLORS["blue"], 5.0, (0, 4.0, 2.5))
    breach_light = area_light("Light_Breach", (0, 8.1, 3.9), 0, COLORS["amber"], 3.2, (0, 2.0, 2.5))

    camera_data = bpy.data.cameras.new("Camera_42mm")
    camera = bpy.data.objects.new("Camera_42mm", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -17.2, 3.4)
    camera_data.lens = 42
    camera_data.sensor_width = 36
    point_camera(camera, (0, 3.0, 3.85))
    scene.camera = camera

    return {
        "materials": mats,
        "aperture": aperture,
        "door": door,
        "locks": locks,
        "stations": stations,
        "rails": rails,
        "breach_light": breach_light,
    }


def configure_render(scene, width: int, height: int) -> None:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.use_file_extension = True
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass

    layer = scene.view_layers[0]
    layer.use_pass_z = True
    layer.use_pass_normal = True
    layer.use_pass_object_index = True


def configure_compositor(scene, pass_dir: pathlib.Path):
    layer = scene.view_layers[0]
    layer.use_pass_z = True
    layer.use_pass_normal = True
    layer.use_pass_object_index = True
    scene.use_nodes = True
    nodes = scene.node_tree.nodes
    links = scene.node_tree.links
    nodes.clear()
    render_layers = nodes.new("CompositorNodeRLayers")
    render_layers.layer = layer.name
    composite = nodes.new("CompositorNodeComposite")
    links.new(render_layers.outputs["Image"], composite.inputs["Image"])

    depth_map = nodes.new("CompositorNodeMapRange")
    depth_map.inputs["From Min"].default_value = 6.0
    depth_map.inputs["From Max"].default_value = 30.0
    depth_map.inputs["To Min"].default_value = 1.0
    depth_map.inputs["To Max"].default_value = 0.0
    depth_map.use_clamp = True
    links.new(render_layers.outputs["Depth"], depth_map.inputs["Value"])

    normal_scale = nodes.new("CompositorNodeMixRGB")
    normal_scale.blend_type = "MULTIPLY"
    normal_scale.inputs[0].default_value = 1.0
    normal_scale.inputs[2].default_value = (0.5, 0.5, 0.5, 1.0)
    links.new(render_layers.outputs["Normal"], normal_scale.inputs[1])
    normal_bias = nodes.new("CompositorNodeMixRGB")
    normal_bias.blend_type = "ADD"
    normal_bias.inputs[0].default_value = 1.0
    normal_bias.inputs[2].default_value = (0.5, 0.5, 0.5, 1.0)
    links.new(normal_scale.outputs[0], normal_bias.inputs[1])

    outputs = {}
    for name, socket in (("depth", depth_map.outputs["Value"]), ("normal", normal_bias.outputs[0])):
        output = nodes.new("CompositorNodeOutputFile")
        output.base_path = str(pass_dir)
        output.format.file_format = "PNG"
        output.format.color_mode = "RGB"
        output.file_slots[0].path = name
        links.new(socket, output.inputs[0])
        outputs[name] = output
    return outputs


def render_object_id(scene, output_path: pathlib.Path) -> None:
    id_colors = {
        1: "27364A",
        2: "66C4D2",
        3: "C4956A",
        4: "D8CCB3",
    }
    id_materials = {}
    for pass_index, color in id_colors.items():
        id_materials[pass_index] = material(
            f"PASS_ObjectId_{pass_index}",
            "000000",
            0.0,
            1.0,
            color,
            1.0,
        )

    originals = {}
    for obj in scene.objects:
        if obj.type != "MESH":
            continue
        originals[obj.name] = list(obj.data.materials)
        obj.data.materials.clear()
        obj.data.materials.append(id_materials.get(obj.pass_index, id_materials[1]))

    light_energy = {obj.name: obj.data.energy for obj in scene.objects if obj.type == "LIGHT"}
    for obj in scene.objects:
        if obj.type == "LIGHT":
            obj.data.energy = 0
    background = scene.world.node_tree.nodes["Background"]
    original_background = tuple(background.inputs["Color"].default_value)
    original_strength = background.inputs["Strength"].default_value
    background.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    background.inputs["Strength"].default_value = 0.0
    scene.use_nodes = False
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    scene.use_nodes = True
    background.inputs["Color"].default_value = original_background
    background.inputs["Strength"].default_value = original_strength
    for obj in scene.objects:
        if obj.type == "LIGHT":
            obj.data.energy = light_energy[obj.name]

    for obj in scene.objects:
        if obj.name not in originals:
            continue
        obj.data.materials.clear()
        for original in originals[obj.name]:
            obj.data.materials.append(original)
    for id_material in id_materials.values():
        bpy.data.materials.remove(id_material)


def apply_state(parts, state):
    route = state["route"]
    for action in ("pick", "search", "sabotage"):
        active = state["active"] and (state["all_routes"] or action == route)
        set_emission(parts["materials"][action], COLORS[{"pick": "blue", "search": "green", "sabotage": "red"}[action]], 2.6 if active else 0.06)
        parts["rails"][action].hide_render = False
    for index, lock in enumerate(parts["locks"]):
        lock.data.materials.clear()
        lock.data.materials.append(parts["materials"]["search"] if index < state["locks"] else parts["materials"]["brass"])
    set_emission(parts["materials"]["search"], COLORS["green"], 2.4 if state["locks"] else (2.6 if state["active"] and route == "search" else 0.06))
    for index, (_, screen) in enumerate(parts["stations"], start=1):
        screen.data.materials.clear()
        screen.data.materials.append(parts["materials"]["sabotage"] if index == state["affected"] else parts["materials"]["pick"])
    parts["door"].location.x = 2.9 if state["breached"] else 0.0
    parts["door"].rotation_euler.y = math.radians(-18) if state["breached"] else 0.0
    parts["breach_light"].data.energy = 1450 if state["breached"] else 0
    parts["aperture"].hide_render = False
    set_emission(parts["materials"]["breach"], COLORS["amber"], 6.0 if state["breached"] else 0.22)


def write_camera_evidence(scene, output_path: pathlib.Path, width: int, height: int) -> None:
    # Camera transforms are dependency-graph evaluated. Updating here keeps the
    # projected evidence tied to the camera that Blender actually renders.
    bpy.context.view_layer.update()
    segments = []
    for x in (-5.2, -2.6, 2.6, 5.2):
        near = world_to_camera_view(scene, scene.camera, Vector((x, -5.6, 0.015)))
        far = world_to_camera_view(scene, scene.camera, Vector((x, 8.5, 0.015)))
        segments.append([
            round(far.x * width, 3),
            round((1.0 - far.y) * height, 3),
            round(near.x * width, 3),
            round((1.0 - near.y) * height, 3),
        ])
    output_path.write_text(json.dumps({
        "camera": scene.camera.name,
        "lensMm": scene.camera.data.lens,
        "renderSize": [width, height],
        "parallelWorldLines": segments,
    }, indent=2), encoding="utf-8")


def write_scene_stats(scene, output_path: pathlib.Path) -> None:
    triangles = 0
    for obj in scene.objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    output_path.write_text(json.dumps({
        "triangles": triangles,
        "materials": len(bpy.data.materials),
        "dynamicLights": sum(1 for obj in scene.objects if obj.type == "LIGHT"),
        "meshObjects": sum(1 for obj in scene.objects if obj.type == "MESH"),
    }, indent=2), encoding="utf-8")


def main() -> None:
    args = arguments()
    output_dir = pathlib.Path(args.output_dir).resolve()
    blend_path = pathlib.Path(args.blend_path).resolve()
    render_dir = output_dir / "renders"
    pass_root = output_dir / "passes"
    render_dir.mkdir(parents=True, exist_ok=True)
    pass_root.mkdir(parents=True, exist_ok=True)
    blend_path.parent.mkdir(parents=True, exist_ok=True)

    scene = bpy.context.scene
    configure_render(scene, args.width, args.height)
    parts = build_scene(scene)
    write_camera_evidence(scene, output_dir / "camera-segments.json", args.width, args.height)

    for state_index, (state_name, state) in enumerate(STATES.items(), start=1):
        scene.frame_set(state_index)
        apply_state(parts, state)
        pass_dir = pass_root / state_name
        pass_dir.mkdir(parents=True, exist_ok=True)
        outputs = configure_compositor(scene, pass_dir)
        for pass_name, output in outputs.items():
            output.file_slots[0].path = f"{pass_name}-"
        scene.render.filepath = str(render_dir / f"{state_name}.png")
        bpy.ops.render.render(write_still=True)
        render_object_id(scene, pass_dir / f"object-id-{state_index:04d}.png")

    scene.frame_set(1)
    apply_state(parts, STATES["preparing"])
    write_scene_stats(scene, output_dir / "scene-stats.json")
    scene["world_manifest"] = "world/manifest.json"
    scene["world_version"] = "1.0.0"
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"Built canonical vault: {blend_path}")
    print(f"Rendered {len(STATES)} states: {render_dir}")


if __name__ == "__main__":
    main()
