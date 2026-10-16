if (process.env.VERCEL_ENV === 'production') {
  process.stderr.write(
    'Production deployment is disabled for this draft experience. Preview review is required.\n',
  );
  process.exit(1);
}
