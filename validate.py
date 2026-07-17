"""Validate seeds/golden theo dung JSON Schema V1 cua VAI-11 (khong can thu vien ngoai)."""
import json, re, sys

DT = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
errs = []

EV_REQ = ["schema_version","id","student_id","session_id","skill_id","item_id","is_correct","recorded_at"]
EV_ALLOWED = set(EV_REQ) | {"lesson_id","response_label"}

DP_REQ = ["schema_version","student_id","lesson_id","target_skill_id","readiness_status","confidence","root_causes","generated_at"]
DP_ALLOWED = set(DP_REQ)
RC_REQ = ["skill_id","rank","supporting_evidence_ids","contradicting_evidence_ids"]
STATUS = {"ready","needs_support","abstained"}

def v_event(e, where):
    for k in EV_REQ:
        if k not in e: errs.append(f"{where}: thieu field bat buoc '{k}'")
    for k in e:
        if k not in EV_ALLOWED: errs.append(f"{where}: field la '{k}' (additionalProperties=false)")
    if e.get("schema_version") != "1": errs.append(f"{where}: schema_version phai la '1'")
    if not isinstance(e.get("is_correct"), bool): errs.append(f"{where}: is_correct phai la boolean")
    if not DT.match(e.get("recorded_at","")): errs.append(f"{where}: recorded_at sai format date-time")
    for k in ["id","student_id","session_id","skill_id","item_id"]:
        if not isinstance(e.get(k), str) or len(e.get(k,"")) < 1:
            errs.append(f"{where}: {k} phai la string minLength 1")

def v_profile(p, where):
    for k in DP_REQ:
        if k not in p: errs.append(f"{where}: thieu field bat buoc '{k}'")
    for k in p:
        if k not in DP_ALLOWED: errs.append(f"{where}: field la '{k}' (additionalProperties=false)")
    if p.get("schema_version") != "1": errs.append(f"{where}: schema_version phai la '1'")
    if p.get("readiness_status") not in STATUS:
        errs.append(f"{where}: readiness_status='{p.get('readiness_status')}' khong thuoc enum {STATUS}")
    c = p.get("confidence")
    if not isinstance(c,(int,float)) or not (0 <= c <= 1):
        errs.append(f"{where}: confidence={c} phai la number trong [0,1]")
    if not DT.match(p.get("generated_at","")): errs.append(f"{where}: generated_at sai format")
    for i, rc in enumerate(p.get("root_causes", [])):
        w = f"{where}.root_causes[{i}]"
        for k in RC_REQ:
            if k not in rc: errs.append(f"{w}: thieu '{k}'")
        for k in rc:
            if k not in RC_REQ: errs.append(f"{w}: field la '{k}'")
        if not isinstance(rc.get("rank"), int) or rc.get("rank",0) < 1:
            errs.append(f"{w}: rank phai la integer >= 1")

# --- Load ---
items = json.load(open('data/seeds/items.json', encoding='utf-8'))['items']
curr = json.load(open('data/seeds/curriculum.json', encoding='utf-8'))
studs = json.load(open('data/seeds/students.json', encoding='utf-8'))['students']
events = json.load(open('data/seeds/evidence-events.json', encoding='utf-8'))['events']
profiles = json.load(open('data/seeds/diagnostic-profiles.json', encoding='utf-8'))['profiles']
golden = json.load(open('eval/golden/golden-cases.json', encoding='utf-8'))['golden_cases']

# --- Schema validation ---
for e in events: v_event(e, f"event {e.get('id')}")
for p in profiles: v_profile(p, f"profile {p.get('student_id')}")
for gc in golden:
    for e in gc['events']: v_event(e, f"{gc['golden_case_id']}.event {e.get('id')}")
    v_profile(gc['expected_profile'], f"{gc['golden_case_id']}.expected_profile")

# --- Acceptance criteria VAI-13 ---
skill_ids = {s['skill_id'] for s in curr['skills']}
mis_ids = {m['misconception_id'] for m in curr['misconceptions']}

# AC: moi cau hoi map it nhat 1 skill
for it in items:
    if not it.get('skill_ids'): errs.append(f"{it['item_id']}: khong map skill nao")
    for s in it['skill_ids']:
        if s not in skill_ids: errs.append(f"{it['item_id']}: skill_id '{s}' khong ton tai trong curriculum")
    # AC: distractor map misconception
    for o in it['options']:
        if not o['is_correct'] and not o.get('misconception_id'):
            errs.append(f"{it['item_id']}: distractor '{o['label'][:30]}' chua map misconception")
        if o.get('misconception_id') and o['misconception_id'] not in mis_ids:
            errs.append(f"{it['item_id']}: misconception '{o['misconception_id']}' khong ton tai")
    # moi cau chinh xac 1 dap an dung
    n = sum(1 for o in it['options'] if o['is_correct'])
    if n != 1: errs.append(f"{it['item_id']}: co {n} dap an dung (phai =1)")

# AC: referential integrity
item_ids = {i['item_id'] for i in items}
stu_ids = {s['student_id'] for s in studs}
ev_ids = {e['id'] for e in events}
for e in events:
    if e['item_id'] not in item_ids: errs.append(f"event {e['id']}: item_id khong ton tai")
    if e['student_id'] not in stu_ids: errs.append(f"event {e['id']}: student_id khong ton tai")
for p in profiles:
    for rc in p['root_causes']:
        if rc['skill_id'] not in skill_ids: errs.append(f"profile {p['student_id']}: skill khong ton tai")
        for eid in rc['supporting_evidence_ids'] + rc['contradicting_evidence_ids']:
            if eid not in ev_ids: errs.append(f"profile {p['student_id']}: evidence '{eid}' khong ton tai")
for gc in golden:
    gev = {e['id'] for e in gc['events']}
    for rc in gc['expected_profile']['root_causes']:
        for eid in rc['supporting_evidence_ids'] + rc['contradicting_evidence_ids']:
            if eid not in gev: errs.append(f"{gc['golden_case_id']}: evidence '{eid}' khong nam trong events cua golden case")

# AC: privacy - khong co PII
PII = re.compile(r'(@|\+84|09\d{8}|\bCMND\b|\bCCCD\b)', re.I)
blob = json.dumps({"s":studs,"e":events}, ensure_ascii=False)
if PII.search(blob): errs.append("PRIVACY: phat hien du lieu giong PII")

# AC: golden phai co expected diagnosis/group/path
for gc in golden:
    for k in ["expected_profile","expected_group","expected_path_skill_ids"]:
        if k not in gc: errs.append(f"{gc['golden_case_id']}: thieu '{k}'")

# --- Report ---
print("="*60)
print(f"Items: {len(items)} | Skills: {len(skill_ids)} | Misconceptions: {len(mis_ids)}")
print(f"Students: {len(studs)} | Events: {len(events)} | Profiles: {len(profiles)} | Golden: {len(golden)}")
print("="*60)
print("Golden cases:")
for gc in golden:
    ep = gc['expected_profile']
    print(f"  {gc['golden_case_id']:36s} status={ep['readiness_status']:14s} conf={ep['confidence']}")
print("="*60)
if errs:
    print(f"FAIL - {len(errs)} loi:")
    for e in errs[:30]: print("  -", e)
    sys.exit(1)
print("PASS - tat ca validation deu dat")
