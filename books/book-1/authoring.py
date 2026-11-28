"""Helpers to author unit JSON files (Arabic written by hand, Korean copied from the old Book 1)."""
import json
QN="اختبار الوحدة: جملتان لكل قاعدة، مع كلمات من وحدات سابقة. الحل بدون النظر إلى الصفحات، ثم التصحيح من مفتاح الإجابات."
def quiz(fills, words):
    if len(fills)+len(words)<=13:
        return [[{"type":"title","h1":"اختبار الوحدة","sub":QN},{"type":"fill","no":1,"title":"القواعد: أكمل الجملة","items":fills},{"type":"translate","no":2,"title":"المفردات: اكتب الكلمة بالكوري","items":words,"start":len(fills)}]]
    h=(len(fills)+1)//2 if len(fills)>9 else len(fills)
    return [[{"type":"title","h1":"اختبار الوحدة","sub":QN},{"type":"fill","no":1,"title":"القواعد: أكمل الجملة","items":fills[:h]}],
            [{"type":"fill","no":1,"title":"القواعد (تابع)","start":h,"items":fills[h:]} if fills[h:] else {"type":"text","text":""},{"type":"translate","no":2,"title":"المفردات: اكتب الكلمة بالكوري","items":words,"start":len(fills)}]]
def opener(h1,sub,goals,test):
    return [{"type":"title","h1":h1,"sub":sub},{"type":"goals","items":goals},test]
def dlg(kicker,h1,lines,tag,note):
    return [{"type":"title","kicker":kicker,"h1":h1},{"type":"dialogue","lines":lines},{"type":"note","tag":tag,"text":note}]
def save(u): json.dump(u,open(f"units/{u['number']:02d}.json","w"),ensure_ascii=False,indent=1)
