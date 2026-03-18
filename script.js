document.addEventListener("DOMContentLoaded",()=>{

  // === TILT 3D no Header ===
  document.querySelectorAll('.tilt').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
      card.style.transform=`perspective(800px) rotateX(${-(y/r.height)*5}deg) rotateY(${(x/r.width)*5}deg) scale3d(1.01,1.01,1.01)`;
      card.style.transition='transform .08s ease-out';
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      card.style.transition='transform .5s cubic-bezier(.25,1,.5,1)';
    });
  });

  // === SIDEBAR ATIVA ===
  const page=window.location.pathname.split('/').pop().toLowerCase()||'index.html';
  document.querySelectorAll('.nav-item').forEach(i=>{
    const h=i.getAttribute('href').toLowerCase();
    if(h===page||(page===''&&h==='index.html'))i.classList.add('active');
  });

  // === CURSOR GLOW ===
  const glow=document.querySelector('.cursor-glow');
  if(glow){
    document.addEventListener('mousemove',e=>{
      glow.style.left=e.clientX+'px';
      glow.style.top=e.clientY+'px';
    });
  }

  // === PARALLAX nos blobs ===
  const blobs=document.querySelectorAll('.blob');
  if(blobs.length){
    document.addEventListener('mousemove',e=>{
      const cx=window.innerWidth/2,cy=window.innerHeight/2;
      const dx=(e.clientX-cx)/cx,dy=(e.clientY-cy)/cy;
      blobs.forEach((b,i)=>{
        const speed=(i+1)*8;
        b.style.transform=`translate(${dx*speed}px,${dy*speed}px)`;
      });
    });
  }

  // === PARALLAX nas frutas ===
  const fruits=document.querySelectorAll('.fruit-deco');
  if(fruits.length){
    document.addEventListener('mousemove',e=>{
      const cx=window.innerWidth/2,cy=window.innerHeight/2;
      fruits.forEach((f,i)=>{
        const speed=(i+1)*5;
        const dx=((e.clientX-cx)/cx)*speed;
        const dy=((e.clientY-cy)/cy)*speed;
        f.style.transform=`translate(${dx}px,${dy}px)`;
      });
    });
  }

  // === MAGNETIC HOVER nos KPI cards ===
  document.querySelectorAll('.card-kpi,.circular-kpi').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=e.clientX-r.left-r.width/2;
      const y=e.clientY-r.top-r.height/2;
      card.style.transform=`perspective(600px) rotateX(${-(y/r.height)*10}deg) rotateY(${(x/r.width)*10}deg) translateY(-5px) scale(1.03)`;
      card.style.transition='transform .1s ease-out';
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='';
      card.style.transition='transform .5s cubic-bezier(.25,1,.5,1)';
    });
  });
});
