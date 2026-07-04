import bpy
ng=bpy.data.node_groups.new("C","CompositorNodeTree")
cands=['CompositorNodeComposite','NodeGroupOutput','CompositorNodeGroupOutput',
       'CompositorNodeViewer','CompositorNodeOutputFile','NodeGroupInput','CompositorNodeRLayers']
for c in cands:
    try:
        n=ng.nodes.new(c); print("OK", c, "| outs:", [o.name for o in n.outputs], "| ins:", [i.name for i in n.inputs])
    except Exception as ex:
        print("NO", c)
# interface of the group?
print("HAS_INTERFACE", hasattr(ng,"interface"))
