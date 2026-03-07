window.getABToken = function() {
  return localStorage.getItem('ab_token') || sessionStorage.getItem('ab_token') || '';
};

window.clearABToken = function() {
  localStorage.removeItem('ab_token');
  localStorage.removeItem('ab_user');
  localStorage.removeItem('ab_persist');
  sessionStorage.removeItem('ab_token');
};
