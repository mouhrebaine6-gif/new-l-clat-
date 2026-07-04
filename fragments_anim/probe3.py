import bpy
ng=bpy.data.node_groups.new("C","CompositorNodeTree")
gl=ng.nodes.new("CompositorNodeGlare")
props=[p.identifier for p in gl.bl_rna.properties if not p.is_readonly]
print("GLARE_PROPS", props)
print("GLARE_INPUTS", [i.name for i in gl.inputs])
print("GLARE_OUTPUTS", [o.name for o in gl.outputs])
