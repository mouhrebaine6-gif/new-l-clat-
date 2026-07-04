import bpy, traceback
from math import radians
DESK=r"C:\Users\mouhr\Desktop"
OUT=r"D:\LECLAT\fragments_anim\mp4"
FRAGS=["eveil","souffle","forge","prisme","atome","eclipse","horizon","resonance","ascension","origine"]
import sys as _sys
_a=_sys.argv[_sys.argv.index("--")+1:] if "--" in _sys.argv else []
if _a: FRAGS=_a
FR=60; LAITON=(0.95,0.70,0.34,1.0)

def build_and_render(name):
    img_path=DESK+"\\"+name+".jpg"
    scene=bpy.context.scene; scene.frame_start=1; scene.frame_end=FR; scene.render.fps=30
    for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
    for m in list(bpy.data.materials): bpy.data.materials.remove(m)
    for ng0 in [g for g in bpy.data.node_groups]: bpy.data.node_groups.remove(ng0)
    bpy.ops.mesh.primitive_plane_add(size=2.4)
    pl=bpy.context.active_object
    img=bpy.data.images.load(img_path)
    m=bpy.data.materials.new("img"); nt=m.node_tree; nt.nodes.clear()
    t=nt.nodes.new("ShaderNodeTexImage"); t.image=img
    e=nt.nodes.new("ShaderNodeEmission"); e.inputs["Strength"].default_value=1.0
    o=nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(t.outputs["Color"],e.inputs["Color"]); nt.links.new(e.outputs["Emission"],o.inputs["Surface"])
    pl.data.materials.append(m)
    def faille(zname,z,thick,strength):
        bpy.ops.mesh.primitive_plane_add(size=1.0,location=(0,0,z))
        ob=bpy.context.active_object; ob.scale=(thick,1.7,1.0); ob.rotation_euler[2]=radians(-29)
        mt=bpy.data.materials.new(zname)
        try: mt.surface_render_method='BLENDED'
        except: pass
        n=mt.node_tree; n.nodes.clear()
        tc=n.nodes.new("ShaderNodeTexCoord"); sep=n.nodes.new("ShaderNodeSeparateXYZ")
        n.links.new(tc.outputs["Generated"],sep.inputs["Vector"])
        ramp=n.nodes.new("ShaderNodeValToRGB"); cr=ramp.color_ramp
        cr.elements[0].position=0.0; cr.elements[0].color=(0,0,0,1)
        cr.elements[1].position=0.13; cr.elements[1].color=(1,1,1,1)
        cr.elements.new(0.87).color=(1,1,1,1); cr.elements.new(1.0).color=(0,0,0,1)
        n.links.new(sep.outputs["Y"],ramp.inputs["Fac"])
        prog=n.nodes.new("ShaderNodeValue")
        one_m=n.nodes.new("ShaderNodeMath"); one_m.operation='SUBTRACT'; one_m.inputs[0].default_value=1.0
        n.links.new(prog.outputs[0],one_m.inputs[1])
        ysub=n.nodes.new("ShaderNodeMath"); ysub.operation='SUBTRACT'
        n.links.new(sep.outputs["Y"],ysub.inputs[0]); n.links.new(one_m.outputs[0],ysub.inputs[1])
        rev=n.nodes.new("ShaderNodeMath"); rev.operation='MULTIPLY'; rev.inputs[1].default_value=8.0; rev.use_clamp=True
        n.links.new(ysub.outputs[0],rev.inputs[0])
        m1=n.nodes.new("ShaderNodeMath"); m1.operation='MULTIPLY'
        n.links.new(ramp.outputs["Color"],m1.inputs[0]); n.links.new(rev.outputs[0],m1.inputs[1])
        ga=n.nodes.new("ShaderNodeValue")
        m2=n.nodes.new("ShaderNodeMath"); m2.operation='MULTIPLY'
        n.links.new(m1.outputs[0],m2.inputs[0]); n.links.new(ga.outputs[0],m2.inputs[1])
        p=n.nodes.new("ShaderNodeBsdfPrincipled")
        p.inputs["Base Color"].default_value=(0,0,0,1)
        p.inputs["Emission Color"].default_value=LAITON
        p.inputs["Emission Strength"].default_value=strength
        n.links.new(m2.outputs[0],p.inputs["Alpha"])
        on=n.nodes.new("ShaderNodeOutputMaterial"); n.links.new(p.outputs["BSDF"],on.inputs["Surface"])
        ob.data.materials.append(mt)
        for f,v in [(1,0.0),(8,0.0),(26,1.18),(60,1.18)]:
            prog.outputs[0].default_value=v; prog.outputs[0].keyframe_insert("default_value",frame=f)
        for f,v in [(1,1.0),(44,1.0),(58,0.0),(60,0.0)]:
            ga.outputs[0].default_value=v; ga.outputs[0].keyframe_insert("default_value",frame=f)
    faille("glow",0.04,0.050,3.0); faille("core",0.05,0.007,11.0)
    cd=bpy.data.cameras.new("c"); cd.type='ORTHO'
    cam=bpy.data.objects.new("c",cd); cam.location=(0,0,5); scene.collection.objects.link(cam); scene.camera=cam
    for f,v in [(1,2.08),(30,1.95),(60,2.08)]:
        cd.ortho_scale=v; cd.keyframe_insert("ortho_scale",frame=f)
    def keyloc(idx,vals):
        for f,v in vals:
            loc=cam.location; loc[idx]=v; cam.location=loc; cam.keyframe_insert("location",frame=f,index=idx)
    keyloc(0,[(1,0.0),(15,0.035),(30,0.0),(45,-0.035),(60,0.0)]); keyloc(1,[(1,0.0),(30,0.022),(60,0.0)])
    scene.render.engine='BLENDER_EEVEE'; scene.eevee.taa_render_samples=24
    scene.render.resolution_x=1024; scene.render.resolution_y=1024
    w=bpy.data.worlds.new("w"); w.node_tree.nodes["Background"].inputs[0].default_value=(0,0,0,1); scene.world=w
    ng=bpy.data.node_groups.new("Comp","CompositorNodeTree")
    ng.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    scene.compositing_node_group=ng
    rl=ng.nodes.new("CompositorNodeRLayers"); gl=ng.nodes.new("CompositorNodeGlare"); go=ng.nodes.new("NodeGroupOutput")
    try: gl.inputs["Type"].default_value='Bloom'
    except: pass
    for k,v in [("Threshold",0.95),("Strength",1.0),("Size",8.0),("Smoothness",0.25)]:
        if k in gl.inputs:
            try: gl.inputs[k].default_value=v
            except: pass
    ng.links.new(rl.outputs["Image"],gl.inputs["Image"]); ng.links.new(gl.outputs["Image"],go.inputs["Image"])
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=OUT+"\seq\\"+name+"\\"+name+"_"
    bpy.ops.render.render(animation=True)

for nm in FRAGS:
    try:
        build_and_render(nm); print("OK_FRAG",nm,flush=True)
    except Exception as ex:
        print("FAIL_FRAG",nm,ex,flush=True); traceback.print_exc()
print("BATCH_DONE",flush=True)
