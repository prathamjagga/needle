// Simple redirect for API root
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: 'Needle Break Logger API',
    endpoints: {
      submit: '/api/submit',
      test: '/api/test'
    },
    timestamp: new Date().toISOString()
  });
};