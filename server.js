const express=require('express');
const app=express();
app.use(express.json());
app.use(express.static('public'));
const URL=(process.env.SUPABASE_URL||'').replace(/\\/$/,'');
const KEY=process.env.SUPABASE_KEY||'';
async function supa(path,options={}){
  const r=await fetch(URL+path,{...options,headers:{
    apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',
    ...(options.headers||{})
  }});
  const t=await r.text();
  if(!r.ok) throw new Error(t);
  return t?JSON.parse(t):[];
}
app.get('/api/transactions',async(req,res)=>{
  try{res.json(await supa('/transactions?select=*&order=created_at.desc'))}
  catch(e){res.status(500).json({error:e.message})}
});
app.post('/api/transactions',async(req,res)=>{
  try{
    const x=req.body;
    if(!x.date||!x.type||!x.amount||!x.staff) return res.status(400).json({error:'Date, type, amount and staff are required'});
    res.json(await supa('/transactions',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(x)}));
  }catch(e){res.status(500).json({error:e.message})}
});
app.get('/health',(req,res)=>res.json({ok:true,app:'WUTNYANG BUSINESS CENTER'}));
app.listen(process.env.PORT||10000,'0.0.0.0',()=>console.log('WUTNYANG BUSINESS CENTER running'));
