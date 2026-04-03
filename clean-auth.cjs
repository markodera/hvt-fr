const fs = require('fs');

function cleanLogin() {
    let p = 'src/pages/auth/Login.jsx';
    let code = fs.readFileSync(p, 'utf8');
    code = code.replace(/<div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">\s*/, '');
    code = code.replace(/<\/div>\s*<\/AuthLayout>/, '</AuthLayout>');
    fs.writeFileSync(p, code);
}
cleanLogin();

function cleanSignup() {
    let p = 'src/pages/auth/Signup.jsx';
    let code = fs.readFileSync(p, 'utf8');
    code = code.replace(/<div className="mx-auto flex min-h-screen max-w-7xl relative z-10 items-center justify-between gap-12 lg:gap-24">\s*/, '');
    code = code.replace(/<\/div>\s*<\/AuthLayout>/, '</AuthLayout>');
    fs.writeFileSync(p, code);
}
cleanSignup();
