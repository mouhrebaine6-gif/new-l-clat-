import bpy
scene = bpy.context.scene
attrs = [a for a in dir(scene) if 'node' in a.lower() or 'compos' in a.lower()]
print("SCENE_COMPOS_ATTRS", attrs)
# node group types
try:
    print("HAS_compositing_node_group", hasattr(scene, "compositing_node_group"))
except Exception as e:
    print("err", e)
