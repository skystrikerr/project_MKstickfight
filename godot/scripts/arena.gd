extends Node3D

## The look test, built in code rather than in .tscn files.
##
## Everything here is deliberately the same content as the Three.js build:
## the same two GLB bodies out of src/assets/models, the same weapons in the
## same hands, two fighters facing each other on flat ground. What is NOT the
## same is the presentation, and that is the whole experiment - Godot brings
## cast shadows, screen-space ambient occlusion, a real tonemapper and a
## physical sky, none of which the web renderer has. If the models look better
## here, the problem was never the mesh.
##
## Built from script so the project can be authored as text and still open
## cleanly in the editor: a hand-written .tscn that references an imported GLB
## has to carry the UID Godot assigns on import, which cannot be known before
## the first import runs.

## Target standing height in metres. The packs are authored in game units and
## do not agree with each other on how tall a fighter is - viking measures 138
## where roman measures 119 - so a single blanket scale makes one of them a
## head taller than the other for no reason anyone chose.
const FIGHTER_HEIGHT := 1.82

## Fighter id -> body, front-hand weapon, back-hand weapon.
const KIT := {
	"viking": ["viking-body", "viking-axe", "viking-buckler"],
	"roman": ["roman-body", "roman-gladius", "roman-shield"],
}


func _ready() -> void:
	_build_environment()
	_build_ground()
	_build_arena_wall()
	_spawn("viking", Vector3(-1.0, 0, 0), 1.0)
	_spawn("roman", Vector3(1.0, 0, 0), -1.0)
	_build_camera()


## Sky, tonemapper and ambient occlusion.
##
## The tonemapper is the quiet one that matters most. The web build writes
## linear colour straight to the canvas, which is why bright armour clipped to
## a flat grey; ACES rolls the highlight off instead of clamping it, so a lit
## metal surface keeps its shape at the top end.
func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var mat := ProceduralSkyMaterial.new()
	mat.sky_top_color = Color(0.38, 0.52, 0.72)
	mat.sky_horizon_color = Color(0.80, 0.74, 0.62)
	mat.ground_bottom_color = Color(0.52, 0.44, 0.33)
	mat.ground_horizon_color = Color(0.74, 0.66, 0.53)
	sky.sky_material = mat
	env.sky = sky

	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.45
	env.ambient_light_energy = 0.32

	# The contact darkening under a chin, inside an elbow, behind a shield.
	# This is the single biggest reason an untextured mesh reads as solid
	# rather than as plastic, and the web build has no equivalent at all.
	env.ssao_enabled = true
	env.ssao_intensity = 2.6
	env.ssao_radius = 0.35
	env.ssao_detail = 0.8

	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 0.72
	env.tonemap_white = 6.0

	var world := WorldEnvironment.new()
	world.environment = env
	add_child(world)

	# Key light, low and raking, with soft shadows. A fighter that casts a
	# shadow onto the ground is standing on it; one that does not is pasted
	# over it, which is exactly how the web build reads.
	var key := DirectionalLight3D.new()
	key.light_energy = 1.55
	key.light_color = Color(1.0, 0.94, 0.84)
	key.shadow_enabled = true
	key.directional_shadow_blend_splits = true
	key.directional_shadow_max_distance = 40.0
	key.rotation_degrees = Vector3(-42, 35, 0)
	add_child(key)

	# Cool bounce from the opposite side so the shadow side keeps its form
	# instead of going to black.
	var bounce := DirectionalLight3D.new()
	bounce.light_energy = 0.45
	bounce.light_color = Color(0.62, 0.72, 0.95)
	bounce.rotation_degrees = Vector3(-18, -140, 0)
	add_child(bounce)


func _build_ground() -> void:
	var plane := PlaneMesh.new()
	plane.size = Vector2(60, 60)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.58, 0.48, 0.34)
	mat.roughness = 0.95
	# Sand is not a mirror, but it is not matte either - a faint sheen at
	# grazing angles is what separates ground from a coloured card.
	mat.metallic = 0.0
	mat.metallic_specular = 0.25
	plane.material = mat
	var node := MeshInstance3D.new()
	node.mesh = plane
	add_child(node)


## A low wall and a colonnade behind it, so there is something for the key
## light to fall across and something for the fighters to read against.
func _build_arena_wall() -> void:
	var stone := StandardMaterial3D.new()
	stone.albedo_color = Color(0.46, 0.42, 0.36)
	stone.roughness = 0.9

	var wall := BoxMesh.new()
	wall.size = Vector3(40, 2.2, 1.0)
	wall.material = stone
	var wall_node := MeshInstance3D.new()
	wall_node.mesh = wall
	wall_node.position = Vector3(0, 1.1, -6.0)
	add_child(wall_node)

	var column := CylinderMesh.new()
	column.top_radius = 0.34
	column.bottom_radius = 0.40
	column.height = 5.0
	column.material = stone
	for i in range(-5, 6):
		var col := MeshInstance3D.new()
		col.mesh = column
		col.position = Vector3(i * 3.4, 4.7, -6.6)
		add_child(col)

	var arch := BoxMesh.new()
	arch.size = Vector3(40, 1.2, 1.6)
	arch.material = stone
	var arch_node := MeshInstance3D.new()
	arch_node.mesh = arch
	arch_node.position = Vector3(0, 7.8, -6.6)
	add_child(arch_node)


## One fighter: the body GLB, scaled and turned, with its weapons parented to
## the hand bones the pack already names.
func _spawn(id: String, at: Vector3, facing: float) -> void:
	var kit: Array = KIT[id]
	var root := Node3D.new()
	root.name = id
	root.position = at
	# Three-quarter turn off pure profile, the same YAW the web build uses -
	# a fighting game wants the silhouette of a profile and the volume of a
	# turn, and neither on its own reads as a character.
	root.rotation.y = facing * (PI / 2.0 - 0.26)
	add_child(root)

	var body := _load_model(kit[0])
	if body:
		root.add_child(body)
		# Scale by measured height, so both fighters stand the same size
		# whatever units their pack happened to be authored in.
		var box := _bounds(body)
		if box.size.y > 0.0:
			body.scale = Vector3.ONE * (FIGHTER_HEIGHT / box.size.y)

	_attach(root, body, kit[1], "MainHandSocket", Vector3(0.18, 0, 0))
	_attach(root, body, kit[2], "OffHandSocket", Vector3(-0.18, 0, 0))


func _load_model(file: String) -> Node3D:
	var packed := load("res://assets/%s.glb" % file) as PackedScene
	if packed == null:
		push_warning("missing model: %s" % file)
		return null
	var node := packed.instantiate() as Node3D
	# Shadows both ways: a fighter casts onto the ground and receives the
	# bounce, which is what puts them in the scene rather than in front of it.
	for child in _all_meshes(node):
		child.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	return node


## Parent a weapon to a named joint if the pack ships one, and fall back to a
## measured offset if it does not - three of the packs have no hand sockets.
func _attach(root: Node3D, body: Node3D, file: String, socket: String,
		fallback: Vector3) -> void:
	var weapon := _load_model(file)
	if weapon == null:
		return
	var host: Node = null
	if body:
		host = body.find_child(socket, true, false)
	if host is Node3D:
		weapon.scale = Vector3.ONE
		host.add_child(weapon)
	else:
		weapon.position = fallback + Vector3(0, 1.05, 0)
		root.add_child(weapon)


## Side-on, slightly above the fighters' centre of mass, framed so they own
## roughly half the frame height - the genre norm, and about 1.5x tighter
## than the web build currently sits at.
func _build_camera() -> void:
	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_PERSPECTIVE
	cam.fov = 30.0
	cam.position = Vector3(0, 1.05, 5.1)
	cam.rotation_degrees = Vector3(-2.0, 0, 0)
	cam.current = true
	add_child(cam)


## World-space bounds of everything drawn under a node.
func _bounds(node: Node3D) -> AABB:
	var box := AABB()
	var first := true
	for mesh in _all_meshes(node):
		var m := mesh.get_aabb()
		if first:
			box = m
			first = false
		else:
			box = box.merge(m)
	return box


func _all_meshes(node: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	if node is MeshInstance3D:
		out.append(node)
	for child in node.get_children():
		out.append_array(_all_meshes(child))
	return out


## Dev-only: `--shot <path>` draws a few frames and writes a PNG, so the look
## can be compared against the web build without a person holding a camera.
func _process(_delta: float) -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() < 2 or args[0] != "--shot":
		return
	_frames += 1
	if _frames < 12:
		return
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(args[1])
	get_tree().quit()

var _frames := 0
