document.querySelector('#forgot-password').addEventListener('click', () => {
  message('Password recovery is not connected yet. Please contact your school administrator for account assistance.');
});
document.querySelector('.other-button').addEventListener('click', event => {
  const options = document.querySelector('#other-options');
  options.hidden = !options.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!options.hidden));
});
