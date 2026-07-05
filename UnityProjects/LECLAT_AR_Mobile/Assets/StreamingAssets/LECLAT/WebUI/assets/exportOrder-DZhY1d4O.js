import{n as e,r as t}from"./fragments-G7PUY2bR.js";import{E as n,x as r}from"./index-BjTC5OxT.js";var i=e=>`${e.toLocaleString(`fr-FR`)} DA`,a=e=>String(e??``).replace(/[&<>"']/g,e=>{switch(e){case`&`:return`&amp;`;case`<`:return`&lt;`;case`>`:return`&gt;`;case`"`:return`&quot;`;case`'`:return`&#39;`;default:return e}}),o={fr:{lang:`fr`,dir:`ltr`,orderSent:`Ordre transmis`,ritualReference:`Référence rituelle`,status:`État`,recipient:`Destinataire`,transmission:`Transmission`,home:`À domicile`,payment:`Paiement`,fees:`Frais`,ordered:`Pièces commandées`,size:`Taille`,total:`Total transmis`,prepared:`⊹ Préparé par l'atelier ⊹`,quote:`« La pièce voyagera. Veillez sur le passage. »`},en:{lang:`en`,dir:`ltr`,orderSent:`Order sent`,ritualReference:`Ritual reference`,status:`Status`,recipient:`Recipient`,transmission:`Transmission`,home:`Home delivery`,payment:`Payment`,fees:`Fees`,ordered:`Ordered pieces`,size:`Size`,total:`Total sent`,prepared:`⊹ Prepared by the atelier ⊹`,quote:`“The piece will travel. Watch over the passage.”`},ar:{lang:`ar`,dir:`rtl`,orderSent:`تم إرسال الطلب`,ritualReference:`المرجع الطقسي`,status:`الحالة`,recipient:`المستلم`,transmission:`الإرسال`,home:`توصيل إلى المنزل`,payment:`الدفع`,fees:`الرسوم`,ordered:`القطع المطلوبة`,size:`المقاس`,total:`الإجمالي المرسل`,prepared:`⊹ تم التحضير في المشغل ⊹`,quote:`«القطعة ستسافر. احرس العبور.»`}},s=e=>{let t=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${e.ref}.json`,r.click(),URL.revokeObjectURL(n)},c=(s,c=`fr`)=>{let l=o[c],{status:u}=r(s.createdAt),d=c===`en`?`en-US`:c===`ar`?`ar-DZ`:`fr-FR`,f=new Date(s.createdAt).toLocaleString(d),p=s.lines.map(n=>{let r=t(e(n.fragmentId),c),o=a(r?.name??n.name),s=a(n.size),u=a(r?.colorLabel??n.colorLabel??``);return`
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #2a241c;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#d6c39a;">${o}</div>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9px;letter-spacing:.24em;color:#8a7d63;text-transform:uppercase;margin-top:4px;">${a(l.size)} ${s} · ${u}</div>
      </td>
      <td style="padding:12px 8px;text-align:center;font-family:Georgia,'Times New Roman',serif;color:#d6c39a;">×${Number(n.qty)}</td>
      <td style="padding:12px 8px;text-align:right;font-family:Georgia,'Times New Roman',serif;color:#d6c39a;">${i(n.price*n.qty)}</td>
    </tr>
  `}).join(``),m=`
<!doctype html><html lang="${a(l.lang)}" dir="${a(l.dir)}"><head><meta charset="utf-8"><title>${a(s.ref)} — L'Éclat</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:${c===`ar`?`system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`:`Georgia,'Times New Roman',serif`};background:#0d0a06;color:#e8dcc0;padding:48px;max-width:780px;margin:0 auto;}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.32em;text-transform:uppercase;font-size:10px;color:#b89c6a;}
  .ornament{height:1px;background:linear-gradient(90deg,transparent,#b89c6a,transparent);margin:24px 0;}
  h1{font-family:Georgia,'Times New Roman',serif;font-size:48px;font-weight:300;color:#e8dcc0;margin-top:8px;}
  h2{font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:300;color:#d6c39a;margin-bottom:8px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:32px 0;}
  .box{border:1px solid #2a241c;padding:20px;background:rgba(255,255,255,.02);}
  table{width:100%;border-collapse:collapse;margin-top:16px;}
  .total{font-size:32px;color:#b89c6a;}
  .seal{text-align:center;margin-top:48px;padding-top:32px;border-top:1px solid #2a241c;}
  .L{font-size:96px;color:#b89c6a;line-height:1;}
  @media print{body{background:#0d0a06;-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <p class="mono">L'Éclat · Drop 01 · MMXXVI</p>
      <h1>${a(l.orderSent)}</h1>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${a(f)}</p>
    </div>
    <div style="text-align:right;">
      <p class="mono">${a(l.ritualReference)}</p>
      <h2 style="color:#b89c6a;font-size:32px;margin-top:4px;">${a(s.ref)}</h2>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${a(l.status)} : ${a(n(u,c).label)}</p>
    </div>
  </div>

  <div class="ornament"></div>

  <div class="grid">
    <div class="box">
      <p class="mono">${a(l.recipient)}</p>
      <h2 style="margin-top:8px;">${a(s.address.fullname)}</h2>
      <p style="font-style:italic;color:#a89878;">${a(s.address.adresse)}</p>
      <p style="color:#a89878;">${a(s.address.commune)}, ${a(s.address.wilaya)}</p>
      <p style="color:#a89878;">${a(s.address.phone)}</p>
    </div>
    <div class="box">
      <p class="mono">${a(l.transmission)}</p>
      <h2 style="margin-top:8px;">${a(s.delivery===`domicile`?l.home:`Stop Desk Yalidine`)}</h2>
      <p style="font-style:italic;color:#a89878;">${a(l.payment)} : ${a(s.payment.toUpperCase())}</p>
      <p class="mono" style="margin-top:8px;color:#8a7d63;">${a(l.fees)} ${i(s.shipping)}</p>
    </div>
  </div>

  <p class="mono">${a(l.ordered)}</p>
  <table>${p}</table>

  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:32px;padding-top:16px;border-top:1px solid #2a241c;">
    <p class="mono">${a(l.total)}</p>
    <p class="total">${i(s.total)}</p>
  </div>

  <div class="seal">
    <div class="L">L</div>
    <p class="mono" style="margin-top:8px;">${a(l.prepared)}</p>
    <p style="font-style:italic;color:#8a7d63;margin-top:16px;font-size:14px;">${a(l.quote)}</p>
  </div>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script>
</body></html>`,h=window.open(``,`_blank`);h&&(h.document.write(m),h.document.close())};export{c as n,s as t};