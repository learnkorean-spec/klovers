import sys
p = 'src/App.tsx'
s = open(p, encoding='utf-8').read()
a = 'const HangulBookPage = lazy(() => import("./pages/HangulBookPage"));\n'
b = '<Route path="/hangul-book" element={<AuthProtectedRoute><HangulBookPage /></AuthProtectedRoute>} />'
nb = ('{/* The old web book (HangulBookPage) was removed on 27 Sep 2026 (Re: it is\n'
      '                    old and not used). Students get the A0 PDF in My Books on\n'
      '                    the dashboard, so old links land there. */}\n'
      '                <Route path="/hangul-book" element={<Navigate to="/dashboard" replace />} />')
if s.count(a) != 1 or s.count(b) != 1:
    print('MISS'); sys.exit(1)
s = s.replace(a, '').replace(b, nb)
if 'HangulBookPage' in s.replace('The old web book (HangulBookPage)', ''):
    print('still referenced'); sys.exit(1)
open(p, 'w', encoding='utf-8').write(s)
q = 'src/constants/books.ts'
t = open(q, encoding='utf-8').read()
old = ' * `hangul-1` (the old web book at /hangul-book) is deliberately absent: it is\n * not a file, so the dashboard card skips it.\n'
new = ' * `hangul-1` (the old web book at /hangul-book, removed 27 Sep 2026) is\n * deliberately absent: it is not a file, so the dashboard card skips it.\n'
if t.count(old) == 1:
    t = t.replace(old, new)
    open(q, 'w', encoding='utf-8').write(t)
print('ok')
