'use strict';
document.querySelectorAll('input[type="password"]').forEach(input=>{
  let button=input.parentElement.querySelector('.password-toggle');
  if(!button){const wrapper=document.createElement('div');wrapper.className='visibility-wrap';input.before(wrapper);wrapper.append(input);button=document.createElement('button');button.className='password-toggle';wrapper.append(button);}
  button.type='button';button.removeAttribute('role');button.setAttribute('aria-controls',input.id);
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg>';
  const label=input.name==='confirmPassword'?'confirmation password':'password';
  function update(visible){input.type=visible?'text':'password';button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',(visible?'Hide ':'Show ')+label);button.title=(visible?'Hide ':'Show ')+label;}
  update(false);button.addEventListener('click',()=>update(input.type==='password'));input.form?.addEventListener('reset',()=>update(false));
});
