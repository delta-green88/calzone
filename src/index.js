const ALLOWED_HOSTS = [
  "conge.lineheart.lu",
  // add other third-party calendar hosts here as you onboard them
];

function buildVtimezone(tzid) {
  return `BEGIN:VTIMEZONE
TZID:${tzid}
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
`;
}

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get("url");
    const tzid = reqUrl.searchParams.get("tz") || "Europe/Luxembourg";

    if (!target) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    let targetHost;
    try {
      targetHost = new URL(target).hostname;
    } catch {
      return new Response("Invalid url parameter", { status: 400 });
    }

    if (!ALLOWED_HOSTS.includes(targetHost)) {
      return new Response("Host not allowlisted", { status: 403 });
    }

    const res = await fetch(target);
    let text = await res.text();

    text = text.replace(/BEGIN:VEVENT/, buildVtimezone(tzid) + "BEGIN:VEVENT");
    text = text.replace(/^(DTSTART|DTEND):(\d{8}T\d{6})$/gm, `$1;TZID=${tzid}:$2`);

    return new Response(text, {
      headers: { "content-type": "text/calendar; charset=utf-8" },
    });
  },
};
