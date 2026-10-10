const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(
  'provider = "prisma-client-js"',
  'provider = "prisma-client-js"\n  binaryTargets = ["native", "linux-arm64-openssl-3.0.x", "rhel-openssl-3.0.x", "rhel-openssl-1.0.x", "debian-openssl-3.0.x"]'
);
fs.writeFileSync('prisma/schema.prisma', schema);
