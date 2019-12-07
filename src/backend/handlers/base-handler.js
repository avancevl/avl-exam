exports.getRobotsTxt = (req, res) => {
  /*
  GET /robots.txt
   */
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Disallow: /'
  ].join('\n'));
};

exports.baseView = (req, res) => {
  const values = {
    error: res.error ? {message: `${res.error}`, status: res.error.status} : null
  };

  if (res.error) {
    // We should not do any queries for rending base error page.
    return res.render('express/web', {
      ...values,
      user: req.user ? req.user.dump(req) : null
    });
  }

  res.render('express/web', {
    ...values,
    user: req.user ? req.user.dump(req) : null
  });
};
