const form = document.querySelector('form');
const status = document.querySelector('.status');
const submit = form.querySelector('[type="submit"]');
function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
const confirmation = form.elements.confirmPassword;
function validateConfirmation() { if (confirmation) confirmation.setCustomValidity(confirmation.value === form.elements.password.value ? '' : 'Passwords must match.'); }
form.addEventListener('input', validateConfirmation);
form.addEventListener('submit', async event => {
  event.preventDefault();
  validateConfirmation();
  if (!form.reportValidity()) return;
  submit.disabled = true;
  message('Please wait…');
  try {
    const response = await fetch('/api/' + form.dataset.mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to complete your request.');
    message(result.message);
    if (form.dataset.mode === 'login') { window.location.assign('dashboard.html'); return; }
    form.reset();
    if (form.dataset.mode === 'signup') {
      const link = document.createElement('a');
      link.href = 'login.html'; link.textContent = ' Continue to log in.'; status.append(link);
    }
  } catch (error) { message(error.message || 'Unable to connect to the server.', true); }
  finally { submit.disabled = false; }
});
document.querySelectorAll('[data-provider]').forEach(button => button.addEventListener('click', () => message(`${button.dataset.provider} login is not configured. Use your username and password for now.`, true)));

fetch('/api/config').then(r=>r.json()).then(config=>{if(config.mode==='demo'){const p=document.createElement('p');p.className='status';p.textContent='Preview account: student.demo / Preview123! · Demo data resets when the server restarts.';document.querySelector('form').after(p);}else if(config.mode==='unconfigured'){message('Firebase is not configured. Run npm run demo to preview, or follow SETUP.md.');}}).catch(()=>{});
