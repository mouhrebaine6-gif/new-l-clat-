import bpy, sys
print("BLENDER_VERSION", bpy.app.version_string)
try:
    items = bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items
    print("ENGINES", [e.identifier for e in items])
except Exception as e:
    print("ENGINE_ERR", e)
# GPU availability
try:
    prefs = bpy.context.preferences.addons.get('cycles')
    print("CYCLES_ADDON", bool(prefs))
except Exception as e:
    print("PREF_ERR", e)
