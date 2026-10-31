window.DEMO_DATA = {
 "examples": [
  {
   "id": "clean",
   "label": "Clean email",
   "demo": "Clean input → success first try",
   "email": "Hello, my name is Anna Schmidt. I would like to book a double room from 2026-12-10 to 2026-12-14 for 2 guests.\nWe would appreciate a sea view and breakfast included. Contact: anna.schmidt@example.com",
   "simulate": null,
   "status": "ok",
   "attempts": 1,
   "data": {
    "guest_name": "Anna Schmidt",
    "check_in": "2026-12-10",
    "check_out": "2026-12-14",
    "num_guests": 2,
    "room_type": "double",
    "special_requests": [
     "sea view",
     "breakfast included"
    ],
    "contact_email": "anna.schmidt@example.com"
   },
   "errors": [],
   "fallback": null,
   "attempt_trace": [
    {
     "n": 1,
     "raw": "{\"guest_name\": \"Anna Schmidt\", \"check_in\": \"2026-12-10\", \"check_out\": \"2026-12-14\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"sea view\", \"breakfast included\"], \"contact_email\": \"anna.schmidt@example.com\"}",
     "seconds": 14.2,
     "feedback": null,
     "repairs": [],
     "parsed": {
      "guest_name": "Anna Schmidt",
      "check_in": "2026-12-10",
      "check_out": "2026-12-14",
      "num_guests": 2,
      "room_type": "double",
      "special_requests": [
       "sea view",
       "breakfast included"
      ],
      "contact_email": "anna.schmidt@example.com"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": true,
       "msg": ""
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": true,
       "msg": ""
      }
     },
     "errors": []
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  },
  {
   "id": "missing",
   "label": "Missing info",
   "demo": "No dates in the email → nulls",
   "email": "Hi, I'm Carlos Diaz. We are 4 people and want a suite sometime next spring, not sure about dates yet.\nIs parking available? carlos.diaz@gmail.com",
   "simulate": null,
   "status": "ok",
   "attempts": 1,
   "data": {
    "guest_name": "Carlos Diaz",
    "check_in": null,
    "check_out": null,
    "num_guests": 4,
    "room_type": "suite",
    "special_requests": [],
    "contact_email": "carlos.diaz@gmail.com"
   },
   "errors": [],
   "fallback": null,
   "attempt_trace": [
    {
     "n": 1,
     "raw": "{\"guest_name\": \"Carlos Diaz\", \"check_in\": null, \"check_out\": null, \"num_guests\": 4, \"room_type\": \"suite\", \"special_requests\": [], \"contact_email\": \"carlos.diaz@gmail.com\"}",
     "seconds": 5.7,
     "feedback": null,
     "repairs": [],
     "parsed": {
      "guest_name": "Carlos Diaz",
      "check_in": null,
      "check_out": null,
      "num_guests": 4,
      "room_type": "suite",
      "special_requests": [],
      "contact_email": "carlos.diaz@gmail.com"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": true,
       "msg": ""
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": true,
       "msg": ""
      }
     },
     "errors": []
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  },
  {
   "id": "weird",
   "label": "Weird dates",
   "demo": "“3rd of Dec” → ISO dates",
   "email": "hey this is Mark Olsen, need a room 3rd of Dec to 7th of Dec 2026, two adults, double bed pls.\nalso a crib for the baby. mark.olsen@outlook.com",
   "simulate": null,
   "status": "ok",
   "attempts": 1,
   "data": {
    "guest_name": "Mark Olsen",
    "check_in": "2026-12-03",
    "check_out": "2026-12-07",
    "num_guests": 2,
    "room_type": "double",
    "special_requests": [
     "crib for the baby"
    ],
    "contact_email": "mark.olsen@outlook.com"
   },
   "errors": [],
   "fallback": null,
   "attempt_trace": [
    {
     "n": 1,
     "raw": "{\"guest_name\": \"Mark Olsen\", \"check_in\": \"2026-12-03\", \"check_out\": \"2026-12-07\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"crib for the baby\"], \"contact_email\": \"mark.olsen@outlook.com\"}",
     "seconds": 7.3,
     "feedback": null,
     "repairs": [],
     "parsed": {
      "guest_name": "Mark Olsen",
      "check_in": "2026-12-03",
      "check_out": "2026-12-07",
      "num_guests": 2,
      "room_type": "double",
      "special_requests": [
       "crib for the baby"
      ],
      "contact_email": "mark.olsen@outlook.com"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": true,
       "msg": ""
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": true,
       "msg": ""
      }
     },
     "errors": []
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  },
  {
   "id": "spam",
   "label": "Spam",
   "demo": "Not a booking → rejected",
   "email": "CONGRATULATIONS!!! You have been selected to receive a FREE iPhone. Click the link below to claim\nyour prize before it expires. Unsubscribe anytime.",
   "simulate": null,
   "status": "failed",
   "attempts": 1,
   "data": null,
   "errors": [
    "model says this is not a booking request"
   ],
   "fallback": null,
   "attempt_trace": [
    {
     "n": 1,
     "raw": "{\"not_booking\": true}",
     "seconds": 4.3,
     "feedback": null,
     "repairs": [],
     "parsed": {
      "not_booking": true
     },
     "parse_error": null,
     "rejected": true,
     "fields": {},
     "errors": [
      "Not a booking request - the model refused to invent one."
     ]
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  },
  {
   "id": "retry",
   "label": "Broken output → retry",
   "demo": "Broken JSON repaired, bad dates → retry",
   "email": "Hello, my name is Anna Schmidt. I would like to book a double room from 2026-12-10 to 2026-12-14 for 2 guests.\nWe would appreciate a sea view and breakfast included. Contact: anna.schmidt@example.com",
   "simulate": "retry",
   "status": "ok_after_retry",
   "attempts": 2,
   "data": {
    "guest_name": "Anna Schmidt",
    "check_in": "2026-12-10",
    "check_out": "2026-12-14",
    "num_guests": 2,
    "room_type": "double",
    "special_requests": [
     "sea view",
     "breakfast included"
    ],
    "contact_email": "anna.schmidt@example.com"
   },
   "errors": [
    "Contact email is not a valid email address."
   ],
   "fallback": null,
   "attempt_trace": [
    {
     "n": 1,
     "raw": "Sure! Here is the booking you asked for:\n```json\n{\"guest_name\": \"Anna Schmidt\", \"check_in\": \"2026-12-10\", \"check_out\": \"2026-12-14\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"sea view\", \"breakfast included\"], \"contact_email\": \"anna.schmidt at example.com\", }\n```\nLet me know if you need anything else.",
     "seconds": 9.0,
     "feedback": "Your JSON had these errors:\n- contact_email: value is not a valid email address: An email address must have an @-sign.\nFix these errors and return only the corrected JSON.",
     "repairs": [
      "Removed ``` code fences",
      "Dropped text before the JSON",
      "Dropped text after the JSON",
      "Removed trailing comma"
     ],
     "parsed": {
      "guest_name": "Anna Schmidt",
      "check_in": "2026-12-10",
      "check_out": "2026-12-14",
      "num_guests": 2,
      "room_type": "double",
      "special_requests": [
       "sea view",
       "breakfast included"
      ],
      "contact_email": "anna.schmidt at example.com"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": true,
       "msg": ""
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": false,
       "msg": "Contact email is not a valid email address."
      }
     },
     "errors": [
      "Contact email is not a valid email address."
     ]
    },
    {
     "n": 2,
     "raw": "I apologize for the error in the email format. The correct email should include the \"@\" symbol. Here's the corrected JSON:\n\n```json\n{\n  \"guest_name\": \"Anna Schmidt\",\n  \"check_in\": \"2026-12-10\",\n  \"check_out\": \"2026-12-14\",\n  \"num_guests\": 2,\n  \"room_type\": \"double\",\n  \"special_requests\": [\"sea view\", \"breakfast included\"],\n  \"contact_email\": \"anna.schmidt@example.com\"\n}\n```",
     "seconds": 13.0,
     "feedback": null,
     "repairs": [
      "Removed ``` code fences",
      "Dropped text before the JSON"
     ],
     "parsed": {
      "guest_name": "Anna Schmidt",
      "check_in": "2026-12-10",
      "check_out": "2026-12-14",
      "num_guests": 2,
      "room_type": "double",
      "special_requests": [
       "sea view",
       "breakfast included"
      ],
      "contact_email": "anna.schmidt@example.com"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": true,
       "msg": ""
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": true,
       "msg": ""
      }
     },
     "errors": []
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  },
  {
   "id": "fallback",
   "label": "Broken output → fallback",
   "demo": "3 bad answers → rule-based fallback",
   "email": "Booking request -- Name: Priya Nair -- arriving 24/12/2026 leaving 27/12/2026 -- 2 guests\nroom: SUITE!!! vegetarian breakfast. contact priya.nair@@mail.com (typo? use priya.nair@mail.com)",
   "simulate": "fallback",
   "status": "fallback",
   "attempts": 3,
   "data": {
    "guest_name": "Priya Nair",
    "check_in": "2026-12-24",
    "check_out": "2026-12-27",
    "num_guests": 2,
    "room_type": "suite",
    "special_requests": [
     "breakfast",
     "vegetarian"
    ],
    "contact_email": "priya.nair@mail.com"
   },
   "errors": [
    "The reply contains no JSON at all.",
    "Guest name is empty.",
    "Check-in is not a real date (expected YYYY-MM-DD).",
    "Guests must be a whole number.",
    "Special requests must be a list.",
    "Contact email is not a valid email address.",
    "Check-out is before (or on) check-in."
   ],
   "fallback": {
    "rules": {
     "guest_name": "Priya Nair",
     "check_in": "2026-12-24",
     "check_out": "2026-12-27",
     "num_guests": 2,
     "room_type": "suite",
     "special_requests": [
      "breakfast",
      "vegetarian"
     ],
     "contact_email": "priya.nair@mail.com"
    }
   },
   "attempt_trace": [
    {
     "n": 1,
     "raw": "I'm sorry, I can only answer questions about the hotel.",
     "seconds": 0.0,
     "feedback": "Your JSON had these errors:\n- no JSON object found in model output\nFix these errors and return only the corrected JSON.",
     "repairs": [],
     "parsed": null,
     "parse_error": "The reply contains no JSON at all.",
     "rejected": false,
     "fields": {},
     "errors": [
      "The reply contains no JSON at all."
     ]
    },
    {
     "n": 2,
     "raw": "{\"guest_name\": \"\", \"check_in\": \"first of December\", \"num_guests\": \"a couple\", \"special_requests\": \"none\", \"contact_email\": \"guest-at-mail\"}",
     "seconds": 0.0,
     "feedback": "Your JSON had these errors:\n- guest_name: String should have at least 1 character\n- check_in: Input should be a valid date or datetime, invalid character in year\n- num_guests: Input should be a valid integer, unable to parse string as an integer\n- special_requests: Input should be a valid list\n- contact_email: value is not a valid email address: An email address must have an @-sign.\nFix these errors and return only the corrected JSON.",
     "repairs": [],
     "parsed": {
      "guest_name": "",
      "check_in": "first of December",
      "num_guests": "a couple",
      "special_requests": "none",
      "contact_email": "guest-at-mail"
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": false,
       "msg": "Guest name is empty."
      },
      "check_in": {
       "ok": false,
       "msg": "Check-in is not a real date (expected YYYY-MM-DD)."
      },
      "check_out": {
       "ok": true,
       "msg": ""
      },
      "num_guests": {
       "ok": false,
       "msg": "Guests must be a whole number."
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": false,
       "msg": "Special requests must be a list."
      },
      "contact_email": {
       "ok": false,
       "msg": "Contact email is not a valid email address."
      }
     },
     "errors": [
      "Guest name is empty.",
      "Check-in is not a real date (expected YYYY-MM-DD).",
      "Guests must be a whole number.",
      "Special requests must be a list.",
      "Contact email is not a valid email address."
     ]
    },
    {
     "n": 3,
     "raw": "{\"guest_name\": \"The guest\", \"check_in\": \"2026-12-05\", \"check_out\": \"2026-12-01\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [], \"contact_email\": null}",
     "seconds": 0.0,
     "feedback": null,
     "repairs": [],
     "parsed": {
      "guest_name": "The guest",
      "check_in": "2026-12-05",
      "check_out": "2026-12-01",
      "num_guests": 2,
      "room_type": "double",
      "special_requests": [],
      "contact_email": null
     },
     "parse_error": null,
     "rejected": false,
     "fields": {
      "guest_name": {
       "ok": true,
       "msg": ""
      },
      "check_in": {
       "ok": false,
       "msg": "Check-out is before (or on) check-in."
      },
      "check_out": {
       "ok": false,
       "msg": "Check-out is before (or on) check-in."
      },
      "num_guests": {
       "ok": true,
       "msg": ""
      },
      "room_type": {
       "ok": true,
       "msg": ""
      },
      "special_requests": {
       "ok": true,
       "msg": ""
      },
      "contact_email": {
       "ok": true,
       "msg": ""
      }
     },
     "errors": [
      "Check-out is before (or on) check-in."
     ]
    }
   ],
   "prompt": "You extract hotel booking requests into JSON.\nToday is 2026-10-31; if a date has no year, use the next future occurrence.\nReturn ONLY one JSON object with exactly these keys:\n{\n  \"guest_name\": string,\n  \"check_in\": \"YYYY-MM-DD\" or null,\n  \"check_out\": \"YYYY-MM-DD\" or null (must be after check_in),\n  \"num_guests\": integer 1-10 or null,\n  \"room_type\": \"single\" | \"double\" | \"suite\" | \"unknown\",\n  \"special_requests\": [string, ...] (may be empty),\n  \"contact_email\": valid email or null\n}\nUse null for anything not mentioned. If the email is not a booking request, return {\"not_booking\": true}.\n\nExample email: Hi, I'm Tom Weber. I'd like a double room from 2026-05-02 to 2026-05-05 for 2 people. Could we get a quiet room? Reach me at tom.weber@mail.com\nExample JSON: {\"guest_name\": \"Tom Weber\", \"check_in\": \"2026-05-02\", \"check_out\": \"2026-05-05\", \"num_guests\": 2, \"room_type\": \"double\", \"special_requests\": [\"quiet room\"], \"contact_email\": \"tom.weber@mail.com\"}"
  }
 ],
 "results": {
  "table": [
   {
    "email": "clean_1",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Anna Schmidt",
    "check_in": "2026-12-10",
    "check_out": "2026-12-14",
    "num_guests": 2,
    "room_type": "double"
   },
   {
    "email": "clean_2",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Rahul Mehta",
    "check_in": "2027-01-05",
    "check_out": "2027-01-08",
    "num_guests": 3,
    "room_type": "suite"
   },
   {
    "email": "clean_3",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Lena Fischer",
    "check_in": "2026-11-20",
    "check_out": "2026-11-22",
    "num_guests": 1,
    "room_type": "single"
   },
   {
    "email": "missing_dates",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Carlos Diaz",
    "check_in": null,
    "check_out": null,
    "num_guests": 4,
    "room_type": "suite"
   },
   {
    "email": "no_guest_count",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Yuki Tanaka",
    "check_in": "2026-11-15",
    "check_out": "2026-11-18",
    "num_guests": 2,
    "room_type": "double"
   },
   {
    "email": "weird_dates",
    "status": "ok",
    "attempts": 1,
    "guest_name": "Mark Olsen",
    "check_in": "2026-12-03",
    "check_out": "2026-12-07",
    "num_guests": 2,
    "room_type": "double"
   },
   {
    "email": "messy_slash_dates",
    "status": "ok_after_retry",
    "attempts": 2,
    "guest_name": "Priya Nair",
    "check_in": "2026-12-24",
    "check_out": "2026-12-27",
    "num_guests": 2,
    "room_type": "unknown"
   },
   {
    "email": "spam",
    "status": "failed",
    "attempts": 1,
    "guest_name": null,
    "check_in": null,
    "check_out": null,
    "num_guests": null,
    "room_type": null
   }
  ],
  "parser_demo": [
   {
    "case": "broken JSON (trailing comma, None)",
    "valid": true,
    "repairs": [
     "Removed trailing comma",
     "Converted Python None/True/False to JSON"
    ],
    "errors": []
   },
   {
    "case": "JSON wrapped in text + fences",
    "valid": true,
    "repairs": [
     "Removed ``` code fences",
     "Dropped text before the JSON",
     "Dropped text after the JSON"
    ],
    "errors": []
   },
   {
    "case": "truncated output",
    "valid": true,
    "repairs": [
     "Closed truncated JSON"
    ],
    "errors": []
   },
   {
    "case": "wrong types",
    "valid": false,
    "repairs": [],
    "errors": [
     "Check-in is not a real date (expected YYYY-MM-DD).",
     "Guests must be a whole number.",
     "Special requests must be a list.",
     "Contact email is not a valid email address."
    ]
   },
   {
    "case": "check_out before check_in",
    "valid": false,
    "repairs": [],
    "errors": [
     "Check-out is before (or on) check-in."
    ]
   },
   {
    "case": "unexpected room type",
    "valid": false,
    "repairs": [],
    "errors": [
     "Room type must be single, double, suite or unknown."
    ]
   },
   {
    "case": "no JSON at all",
    "valid": false,
    "repairs": [],
    "errors": [
     "The reply contains no JSON at all."
    ]
   }
  ]
 },
 "code": {
  "Booking": "class Booking(BaseModel):\n    guest_name: str = Field(min_length=1)\n    check_in: Optional[date] = None   # null when the email gives no date\n    check_out: Optional[date] = None\n    num_guests: Optional[int] = Field(default=None, ge=1, le=10)\n    room_type: RoomType = RoomType.unknown\n    special_requests: list[str] = Field(default_factory=list)\n    contact_email: Optional[EmailStr] = None\n\n    @model_validator(mode=\"after\")\n    def check_dates(self):\n        if self.check_in and self.check_out and self.check_out <= self.check_in:\n            raise ValueError(\"check_out must be after check_in\")\n        return self\n",
  "parse_json": "def parse_json(text: str) -> dict:\n    \"\"\"Strip code fences / chatter, take the first balanced {...} block, light repair, json.loads.\"\"\"\n    text = re.sub(r\"```(?:json)?\", \"\", text)\n    start = text.find(\"{\")\n    if start == -1:\n        raise ParseError(\"no JSON object found in model output\")\n    depth, end = 0, None\n    for i, ch in enumerate(text[start:], start):\n        depth += ch == \"{\"\n        depth -= ch == \"}\"\n        if depth == 0:\n            end = i + 1\n            break\n    block = text[start:end] if end else text[start:] + \"}\" * depth  # close truncated output\n    block = re.sub(r\",\\s*([}\\]])\", r\"\\1\", block)                     # trailing commas\n    block = re.sub(r\"\\bNone\\b\", \"null\", block)                        # Python-isms\n    block = re.sub(r\"\\bTrue\\b\", \"true\", re.sub(r\"\\bFalse\\b\", \"false\", block))\n    try:\n        obj = json.loads(block)\n    except json.JSONDecodeError as e:\n        raise ParseError(f\"invalid JSON: {e.msg} (char {e.pos})\")\n    if not isinstance(obj, dict):\n        raise ParseError(\"JSON is not an object\")\n    return obj\n",
  "extract": "def extract(email: str, llm: Callable[[list[dict]], str] = llm_generate) -> Result:\n    \"\"\"Ask the LLM, validate, retry with the errors fed back, then fall back to rules.\"\"\"\n    messages = build_messages(email)\n    errors, raws = [], []\n    for attempt in range(1, MAX_RETRIES + 2):\n        raw = llm(messages)\n        raws.append(raw)\n        try:\n            data, errs = parse_and_validate(raw)\n        except NotBooking as e:\n            return Result(None, \"failed\", attempt, errors + [str(e)], raws)\n        if data:\n            return Result(data, \"ok\" if attempt == 1 else \"ok_after_retry\", attempt, errors, raws)\n        errors += [f\"attempt {attempt}: {e}\" for e in errs]\n        # Feed the errors back so the model can correct itself\n        messages = messages + [\n            {\"role\": \"assistant\", \"content\": raw},\n            {\"role\": \"user\", \"content\": \"Your JSON had these errors:\\n- \" + \"\\n- \".join(errs)\n                                        + \"\\nFix these errors and return only the corrected JSON.\"}]\n    return fallback(email, attempt, errors, raws)\n",
  "fallback": "def fallback(email: str, attempts: int, errors: list[str], raws: list[str]) -> Result:\n    data = rule_based_extract(email)\n    found = [k for k in (\"check_in\", \"num_guests\", \"contact_email\") if data[k]] + \\\n            ([\"room_type\"] if data[\"room_type\"] != \"unknown\" else [])\n    if not found:  # nothing booking-like in the text\n        return Result(None, \"failed\", attempts, errors + [\"fallback found no booking information\"], raws)\n    clean, errs = validate(data)\n    if not clean:  # e.g. an invalid email -> drop the offending fields and keep the rest\n        for e in errs:\n            data[e.split(\":\")[0].split(\".\")[0]] = None\n        clean, _ = validate({k: v for k, v in data.items() if v is not None})\n    return Result(clean, \"fallback\" if clean else \"failed\", attempts, errors, raws)\n"
 },
 "labels": {
  "guest_name": "Guest name",
  "check_in": "Check-in",
  "check_out": "Check-out",
  "num_guests": "Guests",
  "room_type": "Room type",
  "special_requests": "Special requests",
  "contact_email": "Contact email"
 }
};
