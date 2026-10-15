# Bakes a room's floor in Blender (Cycles): sky occlusion ("ao") and the
# world's sun shadow ("shadow"), from export-geometry.mjs output.
# Usage: blender -b -P bake.py -- room.f32 outdir HALF_W HALF_D 1024 64
#   (or `python -m` with the bpy module). The sun matches World.tsx:
#   directional light at three.js (14, 7.6, 4.5) toward the origin.
import bpy, sys, math, array, mathutils
argv = sys.argv[sys.argv.index("--")+1:]
src, outdir, HW, HD, res, samples = argv[0], argv[1], float(argv[2]), float(argv[3]), int(argv[4]), int(argv[5])
bpy.ops.wm.read_factory_settings(use_empty=True)
data = array.array('f'); data.frombytes(open(src,'rb').read())
n = len(data)//9
verts = [(data[i*3], -data[i*3+2], data[i*3+1]) for i in range(n*3)]  # three (x,y,z) -> blender (x,-z,y)
faces = [(3*i, 3*i+1, 3*i+2) for i in range(n)]
me = bpy.data.meshes.new("court"); me.from_pydata(verts, [], faces); me.update()
occ = bpy.data.objects.new("court", me); bpy.context.scene.collection.objects.link(occ)
mo = bpy.data.materials.new("occ"); mo.use_nodes=True; occ.data.materials.append(mo)
# receiver: the courtyard floor
bpy.ops.mesh.primitive_plane_add(size=1, location=(0,0,0.001)); fl = bpy.context.object
fl.scale = (HW*2, HD*2, 1); bpy.ops.object.transform_apply(scale=True)
sc = bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=samples
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes=True
sc.world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
W = res; H = int(round(res*HD/HW))
def bake(kind, name):
    img = bpy.data.images.new(name, W, H, alpha=False, float_buffer=False)
    m = bpy.data.materials.new(name); m.use_nodes=True
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img
    m.node_tree.nodes.active = t
    fl.data.materials.clear(); fl.data.materials.append(m)
    for o in sc.objects: o.select_set(False)
    fl.select_set(True); bpy.context.view_layer.objects.active = fl
    bpy.ops.object.bake(type=kind, margin=4)
    img.filepath_raw = f"{outdir}/{name}.png"; img.file_format='PNG'; img.save()
    print("BAKED", name, W, H)
sc.world.light_settings.distance = 2.5
bake('AO', 'court_ao')
# sun matching the world: three position (14,7.6,4.5) -> blender (14,-4.5,7.6)
d = mathutils.Vector((14,-4.5,7.6)).normalized()
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.angle = math.radians(2.5)
sun.rotation_euler = (-d).to_track_quat('-Z','Y').to_euler()
bake('SHADOW', 'court_shadow')
