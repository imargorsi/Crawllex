import re,sys,html
src,dst=sys.argv[1],sys.argv[2]
L=open(src,encoding='utf-8').read().split('\n')
def inline(t):
    t=html.escape(t,quote=False)
    t=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',t)
    t=re.sub(r'`(.+?)`',r'<code>\1</code>',t)
    return t
out=['<html><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:10.5pt} h1{font-size:20pt} h2{font-size:15pt;margin-top:18pt} h3{font-size:12pt} table{border-collapse:collapse;width:100%} td,th{border:1px solid #888;padding:3pt;vertical-align:top;font-size:9pt} th{background:#e8e8e8}</style></head><body>']
i=0; mode=None
def close():
    global mode
    if mode: out.append('</%s>'%mode); mode=None
while i<len(L):
    ln=L[i]
    if ln.startswith('|'):
        close()
        rows=[]
        while i<len(L) and L[i].startswith('|'):
            if not re.match(r'^\|(-+\|)+$',L[i]): rows.append([c.strip() for c in L[i].strip().strip('|').split('|')])
            i+=1
        out.append('<table>')
        for k,r in enumerate(rows):
            tag='th' if k==0 else 'td'
            out.append('<tr>'+''.join('<%s>%s</%s>'%(tag,inline(c),tag) for c in r)+'</tr>')
        out.append('</table>'); continue
    m=re.match(r'^(#{1,4}) (.*)',ln)
    if m:
        close(); lvl=len(m.group(1)); out.append('<h%d>%s</h%d>'%(lvl,inline(m.group(2)),lvl))
    elif re.match(r'^- ',ln):
        if mode!='ul': close(); out.append('<ul>'); mode='ul'
        out.append('<li>%s</li>'%inline(ln[2:]))
    elif re.match(r'^\d+\. ',ln):
        if mode!='ol': close(); out.append('<ol>'); mode='ol'
        out.append('<li>%s</li>'%inline(re.sub(r'^\d+\. ','',ln)))
    elif ln.strip()=='':
        close()
    else:
        close(); out.append('<p>%s</p>'%inline(ln))
    i+=1
close()
out.append('</body></html>')
open(dst,'w',encoding='utf-8').write('\n'.join(out))
