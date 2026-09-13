const K="aromatic_pos_complete_v1";let db={items:[],bills:[],customers:[],purchases:[],duePayments:[],operators:[{id:"OP001",name:"Admin",pin:"1234",role:"Admin"}],settings:{shop:"AROMATIC POS",address:"",phone:"",gstin:"",upi:"9353689775@upi",prefix:"INV",currency:"₹",gst:5,printer:"58",authorization:"",digitalSignature:""}};let bill=[],pay="Cash",payData={};let op=null;const $=x=>document.getElementById(x),M=n=>`${db.settings.currency}${Number(n||0).toFixed(2)}`,today=()=>new Date().toISOString().slice(0,10);function save(){localStorage.setItem(K,JSON.stringify(db));localStorage.setItem(K+"_backup",JSON.stringify(db))}function load(){try{let x=localStorage.getItem(K);if(x)db=JSON.parse(x);db.items=(db.items||[]).map(i=>({...i,modelName:i.modelName||"",actualMrp:i.actualMrp??i.mrp??0,deliveryDate:i.deliveryDate||"",guarantee:i.guarantee||""}));db.purchases=db.purchases||[];db.duePayments=db.duePayments||[]}catch(e){}}function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function login(){let a=$("loginUser").value.trim(),b=$("loginPass").value.trim();op=db.operators.find(x=>x.id===a&&x.pin===b);if(!op){$("loginMessage").textContent="Invalid ID/PIN";return}sessionStorage.op=op.id;$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");$("operatorDisplay").textContent=`${op.name} (${op.role})`;refresh();newBill()}
function logout(){sessionStorage.clear();location.reload()}function showPage(id,btn){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active-page"));$(id).classList.add("active-page");document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");if(id==="dashboardPage")dashboard();if(id==="itemsPage")renderItems();if(id==="customersPage")renderCustomers();if(id==="duesPage")renderDues();if(id==="settingsPage")renderSettings();if(id==="reportsPage"){if(!$("reportFrom").value){let d=new Date();d.setDate(1);$("reportFrom").value=d.toISOString().slice(0,10)}if(!$("reportTo").value)$("reportTo").value=today();reports()}}
function refresh(){dashboard();renderItems();renderCustomers();renderDues();renderSettings();populateItems();populateCustomers();populatePurchaseItems();renderPurchases();$("shopTitle").textContent=db.settings.shop}
function nextNo(){return `${db.settings.prefix||"INV"}-${String(db.bills.length+1).padStart(5,"0")}`}function newBill(){bill=[];pay="Cash";payData={};$("billNo").textContent=nextNo();$("overallDiscount").value=0;$("received").value=0;$("change").value=M(0);$("billCustomerName").value="";$("billCustomerMobile").value="";$("saleDeliveryDate").value=today();$("saleGuarantee").value="";$("upiBox").classList.add("hidden");$("multiBox").classList.add("hidden");document.querySelectorAll(".pay-btn").forEach((x,i)=>x.classList.toggle("selected",i===0));renderBill();calculate()}
function populateItems(){$("itemSelect").innerHTML='<option value="">Select Item</option>'+db.items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("")}function populateCustomers(){$("customerSelect").innerHTML='<option value="">Walk-in Customer</option>'+db.customers.map(c=>`<option value="${c.id}">${esc(c.name)} - ${esc(c.mobile)}</option>`).join("")}
$("customerSelect").onchange=()=>{let c=db.customers.find(x=>x.id===$("customerSelect").value);if(c){$("billCustomerName").value=c.name;$("billCustomerMobile").value=c.mobile}};
$("itemSelect").onchange=()=>{
    let i=db.items.find(x=>x.id===$("itemSelect").value);
    if(i){
        $("barcodeInput").value=i.barcode||"";
        $("stockHint").textContent=`Available: ${i.stock} ${i.unit}`;
    }else{
        $("barcodeInput").value="";
        $("stockHint").textContent="";
    }
}
function findBarcode(){let q=$("barcodeInput").value.trim().toLowerCase(),i=db.items.find(x=>String(x.barcode).toLowerCase()===q);if(!i)return alert("Barcode not found");$("itemSelect").value=i.id;addItem();$("barcodeInput").value=""}async function scanBarcode(){if(!("BarcodeDetector"in window))return alert("Barcode scanning is not supported here. Enter barcode manually.");let f=document.createElement("input");f.type="file";f.accept="image/*";f.capture="environment";f.onchange=async()=>{try{let d=new BarcodeDetector(),c=await d.detect(await createImageBitmap(f.files[0]));if(c[0]){$("barcodeInput").value=c[0].rawValue;findBarcode()}else alert("No barcode found")}catch(e){alert("Scan failed")}};f.click()}
function addItem(){let i=db.items.find(x=>x.id===$("itemSelect").value),q=Number($("itemQty").value||1);if(!i)return alert("Select item");if(q<=0||q>i.stock)return alert("Invalid quantity/stock");let delivery=$("saleDeliveryDate").value||today(),guarantee=$("saleGuarantee").value.trim();let x=bill.find(a=>a.itemId===i.id);if(x){x.qty+=q;if(delivery)x.deliveryDate=delivery;if(guarantee)x.guarantee=guarantee;}else bill.push({itemId:i.id,qty:q,rate:i.salePrice,gst:i.gst,discount:0,deliveryDate:delivery,guarantee});renderBill();calculate()}
function renderBill(){
  $("billBody").innerHTML=bill.length?bill.map((x,n)=>{
    let i=db.items.find(a=>a.id===x.itemId),g=x.qty*x.rate,d=Math.min(g,g*(x.discount||0)/100),t=g-d,tax=t*x.gst/100;
    return `<tr>
      <td>${esc(i.name)}</td>
      <td>${esc(i.modelName||"-")}</td>
      <td><input style="width:70px" type="number" value="${x.qty}" min="1" onchange="qty(${n},this.value)"></td>
      <td>${M(x.rate)}</td>
      <td>${M(i.actualMrp??i.mrp)}</td>
      <td>${esc(x.deliveryDate||"-")}</td>
      <td>${esc(x.guarantee||"-")}</td>
      <td><input style="width:70px" type="number" value="${x.discount||0}" min="0" max="100" step="0.01" onchange="disc(${n},this.value)">%</td>
      <td>${x.gst}%</td>
      <td>${M(t+tax)}</td>
      <td><button class="delete-small" onclick="bill.splice(${n},1);renderBill();calculate()">×</button></td>
    </tr>`
  }).join(""):'<tr><td colspan="12" class="empty">No items added</td></tr>'
}

function qty(n,v){let q=Number(v),i=db.items.find(x=>x.id===bill[n].itemId);if(q>0&&q<=i.stock)bill[n].qty=q;renderBill();calculate()}function disc(n,v){bill[n].discount=Math.min(100,Math.max(0,Number(v)||0));renderBill();calculate()}
function totals(){let sub=0,itemDiscount=0,tax=0,gst=0;bill.forEach(x=>{let g=x.qty*x.rate,d=Math.min(g,g*(x.discount||0)/100),t=g-d;sub+=g;itemDiscount+=d;tax+=t;gst+=t*x.gst/100});let odPct=Math.min(100,Math.max(0,Number($("overallDiscount").value||0))),od=Math.min(tax,tax*odPct/100),ta=Math.max(0,tax-od),ratio=tax?ta/tax:1,gg=gst*ratio,raw=ta+gg,grand=Math.round(raw);return{sub,itemDiscount,od,odPct,tax:ta,gst:gg,raw,grand,round:grand-raw}}
function calculate(){let t=totals();$("subtotal").textContent=M(t.sub);$("itemDiscount").textContent=M(t.itemDiscount+t.od);$("taxable").textContent=M(t.tax);$("gstTotal").textContent=M(t.gst);$("roundOff").textContent=M(t.round);$("grandTotal").textContent=M(t.grand);$("upiAmount").textContent=M(t.grand);$("change").value=M(Number($("received").value||0)-t.grand);$("billStatus").textContent=status(t.grand);if(pay==="UPI"){let u=`upi://pay?pa=${encodeURIComponent(db.settings.upi)}&pn=${encodeURIComponent(db.settings.shop)}&am=${t.grand.toFixed(2)}&cu=INR`;$("upiQr").src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data="+encodeURIComponent(u);$("upiIdDisplay").textContent=db.settings.upi}}
function status(total){if(pay==="Credit")return"DUE";if(pay==="Multiple")return"PAID";let r=Number($("received").value||0);return r>=total?"PAID":r?"PARTIAL":"UNPAID"}function setPay(p,b){pay=p;payData={};document.querySelectorAll(".pay-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("upiBox").classList.toggle("hidden",p!=="UPI");$("multiBox").classList.toggle("hidden",p!=="Multiple");if(p==="Cash")$("received").value=0;if(p==="UPI")$("received").value=totals().grand;if(p==="Card")$("received").value=totals().grand;if(p==="Credit")$("received").value=0;calculate()}
function confirmUPI(){let r=$("upiRef").value.trim();if(!r)return alert("Enter UPI reference");payData={ref:r};$("received").value=totals().grand;calculate()}function applyMultiple(){let x={Cash:+$("mCash").value||0,UPI:+$("mUpi").value||0,Card:+$("mCard").value||0,Credit:+$("mCredit").value||0},s=Object.values(x).reduce((a,b)=>a+b,0);if(Math.abs(s-totals().grand)>.01)return alert("Multiple payment must equal grand total");payData={...x,ref:$("multiRef").value};$("received").value=s;calculate()}
function saveBill(){if(!bill.length)return alert("Add items");let t=totals();if(pay==="UPI"&&!payData.ref)return alert("Confirm UPI first");if(pay==="Multiple"&&!Object.keys(payData).length)return alert("Apply multiple payment");let name=$("billCustomerName").value.trim()||"Walk-in Customer",mobile=$("billCustomerMobile").value.trim(),c=db.customers.find(x=>mobile&&x.mobile===mobile);if(mobile&&!c){c={id:uid("C"),name,mobile,totalPurchase:0,due:0};db.customers.push(c)}let received=+($("received").value||0),due=Math.max(0,t.grand-received);if(c){c.totalPurchase+=t.grand;c.due+=due}bill.forEach(x=>{let i=db.items.find(a=>a.id===x.itemId);i.stock-=x.qty});let b={id:uid("B"),invoice:$("billNo").textContent,date:new Date().toISOString(),customerId:c?.id||"",customerName:name,mobile,items:structuredClone(bill),...t,payment:pay,paymentData:payData,received,due,authorization:db.settings.authorization||"",digitalSignature:db.settings.digitalSignature||"",operator:op?.id||""};db.bills.push(b);save();alert("Bill saved: "+b.invoice);printBill(b);newBill();refresh()}
function billMarkup(b){
    const width=db.settings.printer||"58";
    const signUrl=new URL("./images/ajay-sign.png",location.href).href;
    const rows=b.items.map(x=>{
        const i=db.items.find(a=>a.id===x.itemId);
        const gross=x.qty*x.rate;
        const discPct=Number(x.discount||0);
        const discAmt=Math.min(gross,gross*discPct/100);
        const taxable=gross-discAmt;
        const gstAmt=taxable*x.gst/100;
        const total=taxable+gstAmt;
        return `<tr>
            <td class="item-name"><b>${esc(i?.name||"Item")}</b><small>${esc(i?.modelName||"")}</small><small>${esc(i?.barcode||"")}</small><small>Del: ${esc(x.deliveryDate||"-")} | Guarantee: ${esc(x.guarantee||"-")}</small></td>
            <td class="center">${x.qty}</td>
            <td class="right rate">${M(x.rate)}</td>
            <td class="center delivery">${esc(x.deliveryDate||"-")}</td>
            <td class="center guarantee">${esc(x.guarantee||"-")}</td>
            <td class="right disc">${discPct}%<small>${M(discAmt)}</small></td>
            <td class="right gst">${x.gst}%<small>${M(gstAmt)}</small></td>
            <td class="right">${M(total)}</td>
        </tr>`;
    }).join("");
    const discountTotal=Number(b.itemDiscount||0)+Number(b.od||0);
    const received=Number(b.received||0);
    const due=Number(b.due||0);
    const change=Math.max(0,received-Number(b.grand||0));
    return `<div class="print-sheet print-${width}">
        <header class="print-header">
            <img class="print-logo" src="./images/icon-192.png" onerror="this.style.display='none'">
            <div class="shop-block">
                <h1>${esc(db.settings.shop||"AROMATIC POS")}</h1>
                ${db.settings.address?`<div>${esc(db.settings.address)}</div>`:""}
                ${db.settings.phone?`<div>Mobile: ${esc(db.settings.phone)}</div>`:""}
                ${db.settings.gstin?`<div>GSTIN: ${esc(db.settings.gstin)}</div>`:""}
            </div>
            <div class="invoice-badge"><b>TAX INVOICE</b><span>${esc(b.invoice)}</span></div>
        </header>
        <div class="print-meta">
            <div><b>Bill No.</b><span>${esc(b.invoice)}</span></div>
            <div><b>Date & Time</b><span>${new Date(b.date).toLocaleString()}</span></div>
            <div><b>Customer</b><span>${esc(b.customerName||"Walk-in Customer")}</span></div>
            <div><b>Mobile</b><span>${esc(b.mobile||"-")}</span></div>
        </div>
        <table class="print-items">
            <thead><tr><th>Item</th><th>Qty</th><th class="rate">Rate</th><th class="delivery">Delivery</th><th class="guarantee">Guarantee</th><th class="disc">Disc</th><th class="gst">GST</th><th>Amount</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="print-summary">
            <div class="summary-left">
                <div><b>Payment:</b> ${esc(b.payment||"Cash")}</div>
                ${b.paymentData?.ref?`<div><b>Reference:</b> ${esc(b.paymentData.ref)}</div>`:""}
                <div><b>Status:</b> ${due>0?"DUE":received>=Number(b.grand||0)?"PAID":"PARTIAL"}</div>
            </div>
            <div class="totals-box">
                <div><span>Subtotal</span><b>${M(b.sub)}</b></div>
                <div><span>Discount</span><b>-${M(discountTotal)}</b></div>
                <div><span>Taxable</span><b>${M(b.tax)}</b></div>
                <div><span>GST</span><b>${M(b.gst)}</b></div>
                <div><span>Round-off</span><b>${M(b.round)}</b></div>
                <div class="grand"><span>Grand Total</span><b>${M(b.grand)}</b></div>
                <div><span>Received</span><b>${M(received)}</b></div>
                ${change>0?`<div><span>Change Return</span><b>${M(change)}</b></div>`:""}
                ${due>0?`<div class="due"><span>Balance / Due</span><b>${M(due)}</b></div>`:""}
            </div>
        </div>
        <div class="authorization-block">
            <div class="authorization-title">Authorization Signature</div>
            <img class="authorization-signature" src="${signUrl}" alt="Authorization Signature">
        </div>
        <footer class="print-footer">
            <b>Thank you for your business!</b>
            <span>Computer generated invoice</span>
        </footer>
    </div>`;
}
function printBill(b){
    let w=window.open("","_blank");
    if(!w)return alert("Allow popups");
    const width=db.settings.printer||"58";
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${esc(b.invoice||"Invoice")}</title><style>
        *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}.print-sheet{margin:0 auto;padding:10px}.print-header{display:flex;align-items:flex-start;gap:8px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px}.print-logo{width:42px;height:42px;object-fit:contain}.shop-block{flex:1;text-align:center;font-size:10px;line-height:1.35}.shop-block h1{font-size:18px;margin:0 0 2px}.invoice-badge{display:flex;flex-direction:column;text-align:right;font-size:9px;white-space:nowrap}.invoice-badge b{font-size:10px}.print-meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;font-size:9px;margin-bottom:8px}.print-meta div{display:flex;flex-direction:column}.print-meta b{font-size:8px;text-transform:uppercase}.print-items{width:100%;border-collapse:collapse;font-size:9px}.print-items th{border-top:1px solid #111;border-bottom:1px solid #111;padding:4px 2px}.print-items td{border-bottom:1px dotted #777;padding:4px 2px;vertical-align:top}.authorization-block{text-align:right;margin-top:18px;padding-top:6px}.authorization-title{font-weight:bold;font-size:10px;text-transform:none;margin-bottom:3px}.authorization-signature{display:block;width:100px;height:auto;max-height:70px;object-fit:contain;margin:0 0 0 auto}.item-name{max-width:110px}.item-name small,.print-items td small{display:block;font-size:7px;color:#555}.center{text-align:center}.right{text-align:right}.print-summary{display:flex;justify-content:space-between;gap:10px;margin-top:8px;font-size:9px}.summary-left{flex:1;line-height:1.5}.totals-box{min-width:145px}.totals-box div{display:flex;justify-content:space-between;gap:12px;padding:2px 0}.totals-box .grand{border-top:2px solid #111;border-bottom:2px solid #111;font-size:12px;padding:5px 0;margin:3px 0}.totals-box .due{font-weight:bold}.print-footer{text-align:center;border-top:1px solid #111;margin-top:10px;padding-top:7px;font-size:9px}.print-footer span{display:block;font-size:7px;margin-top:2px}.print-58{width:58mm}.print-58 .rate,.print-58 .mrp,.print-58 .delivery,.print-58 .guarantee,.print-58 .disc,.print-58 .gst{display:none}.print-58 .print-items th:first-child,.print-58 .print-items td:first-child{width:58%}.print-58 .print-summary{display:block}.print-58 .totals-box{margin-left:auto;width:100%}.print-58 .print-header{display:block;text-align:center}.print-58 .print-logo{display:block;margin:0 auto 3px}.print-58 .invoice-badge{display:block;text-align:center;margin-top:3px}.print-58 .print-meta{grid-template-columns:1fr 1fr}.print-80{width:80mm}.print-80 .print-items{font-size:9px}.print-80 .print-header{align-items:center}.print-A4{width:210mm;padding:14mm}.print-A4 .shop-block h1{font-size:24px}.print-A4 .print-meta{font-size:11px;gap:7px 18px}.print-A4 .print-meta>div:nth-child(2),.print-A4 .print-meta>div:nth-child(4){text-align:right;align-items:flex-end}.print-A4 .print-items{font-size:11px}.print-A4 .print-items th,.print-A4 .print-items td{padding:7px 5px}.print-A4 .print-summary{font-size:11px}.print-A4 .totals-box{min-width:220px}.print-A4 .grand{font-size:15px}@page{margin:0}.print-58{page-break-after:auto}@media print{body{margin:0}.print-sheet{box-shadow:none}}
    </style></head><body>${billMarkup(b)}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),350);
}
function previewBill(){if(!bill.length)return alert("Add items");let t=totals();printBill({invoice:$("billNo").textContent,date:new Date().toISOString(),customerName:$("billCustomerName").value||"Walk-in Customer",mobile:$("billCustomerMobile").value,items:bill,...t,payment:pay,received:+$("received").value||0,due:Math.max(0,t.grand-(+$("received").value||0))})}
function soldQty(itemId){return db.bills.reduce((sum,b)=>sum+(b.items||[]).reduce((s,x)=>s+(x.itemId===itemId?Number(x.qty||0):0),0),0)}
function itemTodaySale(itemId){let d=today();return db.bills.filter(b=>String(b.date||"").slice(0,10)===d).reduce((sum,b)=>sum+(b.items||[]).reduce((s,x)=>{if(x.itemId!==itemId)return s;let g=Number(x.qty||0)*Number(x.rate||0),disc=g*(Number(x.discount||0)/100),t=g-Math.min(g,disc);return s+t+t*Number(x.gst||0)/100},0),0)}
function dashboard(){let d=today(),bs=db.bills.filter(b=>String(b.date||"").slice(0,10)===d);$("dashSales").textContent=M(bs.reduce((a,b)=>a+Number(b.grand||0),0));$("dashBills").textContent=bs.length;$("dashItems").textContent=db.items.length;let totalStock=db.items.reduce((a,i)=>a+Number(i.stock||0),0),stockValue=db.items.reduce((a,i)=>a+Number(i.stock||0)*Number(i.salePrice||0),0);if($("dashStock"))$("dashStock").textContent=totalStock;if($("dashStockValue"))$("dashStockValue").textContent=M(stockValue);$("dashDue").textContent=M(db.customers.reduce((a,c)=>a+(+c.due||0),0));let low=db.items.filter(i=>Number(i.stock||0)<=Number(i.min||0));$("lowStock").innerHTML=low.length?low.map(i=>`<p class="low">⚠ ${esc(i.name)} — ${i.stock} ${i.unit}</p>`).join(""):"<p class='ok'>Stock OK</p>";if($("itemStockTable"))$("itemStockTable").innerHTML=db.items.length?db.items.map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${Number(i.openingStock??i.stock??0)} ${esc(i.unit||"pcs")}</td><td>${soldQty(i.id)} ${esc(i.unit||"pcs")}</td><td>${Number(i.stock||0)} ${esc(i.unit||"pcs")}</td><td>${M(itemTodaySale(i.id))}</td></tr>`).join(""):'<tr><td colspan="5" class="empty">No items</td></tr>';$("recentBills").innerHTML=db.bills.slice(-10).reverse().map(b=>`<tr><td>${esc(b.invoice)}</td><td>${new Date(b.date).toLocaleString()}</td><td>${esc(b.customerName||"Walk-in")}</td><td>${M(b.grand)}</td><td>${esc(b.payment||"")}</td></tr>`).join("")}
function itemModal(id=""){let i=db.items.find(x=>x.id===id)||{name:"",modelName:"",barcode:"",unit:"pcs",purchase:0,salePrice:0,mrp:0,actualMrp:0,gst:db.settings.gst,stock:0,min:5,deliveryDate:"",guarantee:""};$("modalContent").innerHTML=`<h3>${id?"Edit":"Add"} Item</h3><div class="item-form-grid"><label><span>Item Name</span><input id="mn" placeholder="Example: VIVO Y75" value="${esc(i.name)}"></label><label><span>Model Name</span><input id="mmodel" placeholder="Example: Vivo Y75 4G" value="${esc(i.modelName)}"></label><label><span>Barcode / SKU</span><input id="mb" placeholder="Example: 88888888" value="${esc(i.barcode)}"></label><label><span>Unit</span><input id="mu" placeholder="Example: pcs" value="${esc(i.unit)}"></label><label><span>Purchase Price</span><input id="mp" type="number" placeholder="Purchase price" value="${i.purchase}"></label><label><span>Selling Price</span><input id="ms" type="number" placeholder="Selling price" value="${i.salePrice}"></label><label><span>Actual MRP</span><input id="mactualmrp" type="number" placeholder="Actual MRP" value="${i.actualMrp??i.mrp??0}"></label><label><span>GST (%)</span><input id="mg" type="number" placeholder="Example: 5, 12, 18" value="${i.gst}"></label><label><span>Opening Stock</span><input id="mq" type="number" placeholder="Starting stock quantity" value="${i.stock}"></label><label><span>Low Stock Alert</span><input id="mi" type="number" placeholder="Example: 2" value="${i.min}"></label></div><br><button class="primary" onclick="saveItem('${id}')">Save Item</button>`;$("modal").classList.remove("hidden")}
function saveItem(id){let d={name:$("mn").value.trim(),modelName:$("mmodel").value.trim(),barcode:$("mb").value.trim(),unit:$("mu").value||"pcs",purchase:+$("mp").value||0,salePrice:+$("ms").value||0,mrp:+$("mactualmrp").value||0,actualMrp:+$("mactualmrp").value||0,gst:+$("mg").value||0,stock:+$("mq").value||0,openingStock:id?(db.items.find(x=>x.id===id)?.openingStock??db.items.find(x=>x.id===id)?.stock??(+$('mq').value||0)):(+$('mq').value||0),min:+$("mi").value||0};if(!d.name)return alert("Name required");if(id)Object.assign(db.items.find(x=>x.id===id),d);else db.items.push({id:uid("I"),...d});save();closeModal();refresh()}
function renderItems(){let q=($("itemSearch")?.value||"").toLowerCase();$("itemsBody").innerHTML=db.items.filter(i=>(i.name+" "+i.modelName+" "+i.barcode).toLowerCase().includes(q)).map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.modelName||"-")}</td><td>${esc(i.barcode)}</td><td>${esc(i.unit)}</td><td>${M(i.purchase)}</td><td>${M(i.salePrice)}</td><td>${M(i.actualMrp??i.mrp)}</td><td>${i.gst}%</td><td class="${i.stock<=i.min?'low':''}">${i.stock}</td><td><button onclick="itemModal('${i.id}')">Edit</button></td></tr>`).join("")}
function populatePurchaseItems(){$("purchaseItem").innerHTML='<option value="">Select Item</option>'+db.items.map(i=>`<option value="${i.id}">${esc(i.name)}${i.modelName?" - "+esc(i.modelName):""}</option>`).join("")}
function savePurchase(){let id=$("purchaseItem").value,i=db.items.find(x=>x.id===id),qty=Number($("purchaseQty").value||0);if(!i)return alert("Select item");if(qty<=0)return alert("Enter valid quantity");let price=Number($("purchasePrice").value||i.purchase||0),mrp=Number($("purchaseMrp").value||i.actualMrp||i.mrp||0);i.stock+=qty;i.purchase=price;if(mrp)i.actualMrp=mrp,i.mrp=mrp;db.purchases.push({id:uid("P"),date:new Date().toISOString(),itemId:id,qty,purchase:price,actualMrp:mrp});save();alert("Stock added successfully");$("purchaseQty").value="";refresh()}
function renderPurchases(){$("purchaseBody").innerHTML=(db.purchases||[]).slice().reverse().map(p=>{let i=db.items.find(x=>x.id===p.itemId);return `<tr><td>${new Date(p.date).toLocaleDateString()}</td><td>${esc(i?.name||"Item")}</td><td>${p.qty}</td><td>${M(p.purchase)}</td><td>${M(p.actualMrp)}</td></tr>`}).join("")||'<tr><td colspan="5" class="empty">No purchase records</td></tr>'}
function customerModal(id=""){let c=db.customers.find(x=>x.id===id)||{name:"",mobile:"",address:""};$("modalContent").innerHTML=`<h3>Customer</h3><div class="form-grid"><input id="cn" placeholder="Name" value="${esc(c.name)}"><input id="cm" placeholder="Mobile" value="${esc(c.mobile)}"><input id="ca" placeholder="Address" value="${esc(c.address)}"></div><br><button class="primary" onclick="saveCustomer('${id}')">Save</button>`;$("modal").classList.remove("hidden")}
function saveCustomer(id){let d={name:$("cn").value.trim(),mobile:$("cm").value.trim(),address:$("ca").value};if(!d.name)return alert("Name required");if(id)Object.assign(db.customers.find(x=>x.id===id),d);else db.customers.push({id:uid("C"),...d,totalPurchase:0,due:0});save();closeModal();refresh()}
function renderCustomers(){let q=($("customerSearch")?.value||"").toLowerCase();$("customersBody").innerHTML=db.customers.filter(c=>(c.name+c.mobile).toLowerCase().includes(q)).map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.mobile)}</td><td>${M(c.totalPurchase)}</td><td>${M(c.due)}</td><td><button onclick="customerModal('${c.id}')">Edit</button></td></tr>`).join("")}
function renderDues(){$("duesBody").innerHTML=db.customers.filter(c=>c.due>0).map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.mobile)}</td><td>${M(c.due)}</td><td><button onclick="receiveDue('${c.id}')">Receive</button></td></tr>`).join("")||'<tr><td colspan="4">No due</td></tr>'}function receiveDue(id){let c=db.customers.find(x=>x.id===id),a=+(prompt(`Due ${M(c.due)}. Amount received:`)||0);if(a>0){c.due=Math.max(0,c.due-a);db.duePayments.push({date:new Date().toISOString(),customerId:id,amount:a});save();refresh()}}
function reports(){let f=$("reportFrom").value,t=$("reportTo").value,bs=db.bills.filter(b=>b.date.slice(0,10)>=f&&b.date.slice(0,10)<=t),sales=bs.reduce((a,b)=>a+b.grand,0),gst=bs.reduce((a,b)=>a+b.gst,0),disc=bs.reduce((a,b)=>a+Number(b.itemDiscount||0)+Number(b.od||0),0),profit=bs.reduce((s,b)=>s+b.items.reduce((z,x)=>{let i=db.items.find(y=>y.id===x.itemId);return z+x.qty*(x.rate-(i?.purchase||0))-(x.discount||0)},0),0);let pm={Cash:0,UPI:0,Card:0,Credit:0,Multiple:0};bs.forEach(b=>pm[b.payment]=(pm[b.payment]||0)+b.grand);let map={};bs.forEach(b=>b.items.forEach(x=>{let i=db.items.find(y=>y.id===x.itemId);map[i?.name||"Item"]=(map[i?.name||"Item"]||0)+x.qty}));let top=Object.entries(map).sort((a,b)=>b[1]-a[1]);$("reportResult").innerHTML=`<div class="cards"><div class="card">Sales<strong>${M(sales)}</strong></div><div class="card">Bills<strong>${bs.length}</strong></div><div class="card">GST<strong>${M(gst)}</strong></div><div class="card">Profit<strong>${M(profit)}</strong></div></div><div class="panel"><h3>Payment Summary</h3><p>Cash ${M(pm.Cash)} | UPI ${M(pm.UPI)} | Card ${M(pm.Card)} | Due ${M(pm.Credit)} | Multiple ${M(pm.Multiple)}</p><p>Total Discount: ${M(disc)}</p></div><div class="panel table-container"><h3>Item-wise / Top Selling</h3><table><tr><th>Item</th><th>Qty</th></tr>${top.map(x=>`<tr><td>${esc(x[0])}</td><td>${x[1]}</td></tr>`).join("")}</table></div><div class="panel table-container"><h3>Stock Report</h3><table><tr><th>Item</th><th>Stock</th><th>Cost Value</th><th>Status</th></tr>${db.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.stock}</td><td>${M(i.stock*i.purchase)}</td><td>${i.stock<=i.min?"LOW":"OK"}</td></tr>`).join("")}</table></div>`}
function printReport(){let w=window.open("","_blank");w.document.write(`<html><body>${$("reportResult").innerHTML}</body></html>`);w.document.close();setTimeout(()=>w.print(),200)}
function renderSettings(){let s=db.settings;["setShop","setAddress","setPhone","setGSTIN","setUPI","setPrefix","setCurrency","setGST"].forEach((x,i)=>$(x).value=[s.shop,s.address,s.phone,s.gstin,s.upi,s.prefix,s.currency,s.gst][i]);$("printerWidth").value=s.printer;$("operators").innerHTML=db.operators.map(o=>`<p>${esc(o.name)} (${esc(o.id)}) — ${esc(o.role)}</p>`).join("")}
function saveSettings(){Object.assign(db.settings,{shop:$("setShop").value||"AROMATIC POS",address:$("setAddress").value,phone:$("setPhone").value,gstin:$("setGSTIN").value,upi:$("setUPI").value,prefix:$("setPrefix").value||"INV",currency:$("setCurrency").value||"₹",gst:+$("setGST").value||5});save();refresh();alert("Settings saved")}function savePrinter(){db.settings.printer=$("printerWidth").value;save();alert("Printer setting saved")}
function addOperator(){let id=$("opId").value.trim(),name=$("opName").value.trim(),pin=$("opPin").value.trim();if(!id||!name||!pin)return alert("Fill operator fields");db.operators.push({id,name,pin,role:$("opRole").value});save();renderSettings()}function exportBackup(){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download=`AROMATIC_POS_Backup_${today()}.json`;a.click()}function importBackup(e){let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.items||!x.bills)throw 0;if(confirm("Restore this backup?")){db=x;save();refresh();alert("Restored")}}catch(_){alert("Invalid backup")}};r.readAsText(e.target.files[0])}function wipe(){if(op?.role!=="Admin")return alert("Admin only");if(confirm("Delete ALL data?")){localStorage.removeItem(K);sessionStorage.clear();location.reload()}}function closeModal(){$("modal").classList.add("hidden")}
document.addEventListener("DOMContentLoaded",()=>{load();let x=sessionStorage.op;if(x){op=db.operators.find(o=>o.id===x);if(op){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");$("operatorDisplay").textContent=`${op.name} (${op.role})`;refresh();newBill()}}else{$("loginUser").value="OP001";$("loginPass").value="1234"}});