#!/usr/bin/env bash
# Backend chalne ke baad poora flow check: ./smoke-test.sh   (ya: BASE=http://192.168.1.5:8080 ./smoke-test.sh)
# Chahiye: curl. Dev OTP = 123456. Har run naye random phone numbers banata hai.
BASE=${BASE:-http://localhost:8080}
PASS=0; FAIL=0

rand_phone() { echo "9$(printf '%09d' $(( (RANDOM * RANDOM) % 1000000000 )))"; }

# call METHOD PATH [TOKEN] [JSON]  ->  BODY, CODE
call() {
  local out
  out=$(curl -s -m 20 -w $'\n%{http_code}' -X "$1" "$BASE$2" \
        -H 'Content-Type: application/json' ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}) || { BODY=""; CODE=000; return; }
  CODE=${out##*$'\n'}; BODY=${out%$'\n'*}
}
field() { echo "$BODY" | grep -o "\"$1\":\"\?[^,\"}]*" | head -1 | sed -E "s/\"$1\":\"?//"; }
check() { # name, ok(0/1)
  if [ "$2" = 0 ]; then echo "  PASS  $1"; PASS=$((PASS+1)); else echo "  FAIL  $1   (HTTP $CODE) $BODY" | cut -c1-300; FAIL=$((FAIL+1)); fi
}
expect_code() { [ "$CODE" = "$2" ]; check "$1" $?; }
expect_has()  { echo "$BODY" | grep -q "$2"; check "$1" $?; }

echo "== Backend: $BASE"
call GET /privacy-policy.html;                               expect_code "server chal raha hai (static page)" 200

CP=$(rand_phone); WP=$(rand_phone)
echo "== Contractor signup ($CP)"
call POST /auth/send-otp "" "{\"phone\":\"$CP\"}";           expect_code "OTP bheja" 200
call POST /auth/verify-otp "" "{\"phone\":\"$CP\",\"otp\":\"123456\",\"name\":\"Test Contractor\",\"role\":\"CONTRACTOR\",\"city\":\"Noida\"}"
expect_code "contractor login/signup" 200; CT=$(field token); CID=$(field userId)
call PUT /contractors/profile "$CT" '{"companyName":"Test Constructions","workType":"Mason","experienceYears":8}'
expect_code "contractor profile save" 200
call POST /jobs "$CT" '{"title":"Mason chahiye","location":"Noida Sector 62","salary":900,"workersNeeded":5}'
expect_code "job post" 201; JID=$(field id)

echo "== Worker signup ($WP)"
call POST /auth/send-otp "" "{\"phone\":\"$WP\"}";            expect_code "OTP bheja" 200
call POST /auth/verify-otp "" "{\"phone\":\"$WP\",\"otp\":\"123456\",\"name\":\"Test Worker\",\"role\":\"USER\",\"city\":\"Noida\"}"
expect_code "worker login/signup" 200; UT=$(field token)
call POST /auth/verify-otp "" "{\"phone\":\"$WP\",\"otp\":\"000000\"}"; expect_code "galat OTP reject (401)" 401

echo "== Follow, feed, notification"
call POST "/follow/$CID" "$UT";                              expect_code "contractor follow" 200
call POST /jobs "$CT" '{"title":"Painter chahiye","location":"Noida Sector 18","salary":800,"workersNeeded":3}'
expect_code "dusri job post" 201
call GET /jobs/feed "$UT";                                   expect_has "feed me followed contractor ki job" "Painter chahiye"
sleep 3
call GET /notifications "$UT";                               expect_has "followers ko notification mila" "Painter chahiye"
call GET "/jobs?city=Noida" "$UT";                           expect_has "city search" "Mason chahiye"
call GET "/jobs/by-contractor/$CID" "$UT";                   expect_has "contractor ki open jobs" "Mason chahiye"

echo "== Apply + applicants"
call PUT /workers/me/profile "$UT" '{"skills":"Mason, Plaster","experienceYears":5,"about":"Noida me kaam kiya"}'
expect_code "worker profile" 200
call POST "/jobs/$JID/apply" "$UT";                          expect_code "apply" 201
call POST "/jobs/$JID/apply" "$UT";                          expect_code "dobara apply = 409" 409
call GET "/jobs/$JID/applicants" "$CT";                      expect_has "contractor ko applicant + skills dikhe" "Mason, Plaster"
AID=$(echo "$BODY" | grep -o '"applicationId":[0-9]*' | head -1 | cut -d: -f2)
call PUT "/applications/$AID/status" "$CT" '{"status":"ACCEPTED"}'; expect_code "applicant accept" 200
call GET /jobs/feed "$CT";                                   expect_code "role check: contractor feed = 403" 403

echo "== Hisaab (attendance, overtime, paisa mila)"
TODAY=$(date +%F); MONTH=$(date +%Y-%m)
call PUT /attendance/settings "$UT" '{"dailyWage":700,"overtimeRate":100}'; expect_code "rate set" 200
call PUT "/attendance/$TODAY" "$UT" '{"status":"PRESENT","overtimeHours":2,"note":"site"}'; expect_code "aaj ki hazri + 2h overtime" 200
call GET "/attendance/summary?month=$MONTH" "$UT";           expect_has "kamai = 700 + 2x100 = 900" '"totalAmount":900'
call POST /attendance/payments "$UT" "{\"date\":\"$TODAY\",\"amount\":500,\"note\":\"advance\"}"; expect_code "paisa mila entry" 201
call GET "/attendance/summary?month=$MONTH" "$UT";           expect_has "baaki = 900 - 500 = 400" '"balance":400'

echo "== Account delete"
call DELETE /users/me "$UT";                                 expect_code "worker account delete" 204
call DELETE /users/me "$CT";                                 expect_code "contractor account delete (jobs bhi)" 204

echo; echo "Result: $PASS pass, $FAIL fail"
[ "$FAIL" = 0 ]
