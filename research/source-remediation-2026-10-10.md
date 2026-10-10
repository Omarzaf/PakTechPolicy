# Source remediation, 2026-10-10

Input: the 9 October 2026 link audit (26 failing URLs, 29 references, 16
records). Each URL was rechecked on 2026-10-10 with `curl` and, where curl
failed, with the built-in browser. Dead URLs were replaced only after the same
instrument was opened at the new location. If no live official copy was found,
the replacement is an existing Internet Archive capture of the exact original
URL. Nothing was submitted to Save Page Now or any other service.

Method notes:

- "Byte-identical" means the SHA-256 of the file at the new URL equals the
  SHA-256 of the Wayback capture of the original URL.
- MoITT moved its documents from `/SiteImage/Misc/files/` to
  `/SiteImage/Legislations/` and `/SiteImage/Policies/`. The old `Detail/`,
  `SliderDetail/` and `NewsDetail/` GUID pages now return HTTP 500, and the
  current site has no equivalent page at those addresses.
- PDA moved its standards portal from `standards.pda.gov.pk` (which now serves
  an Apache test page) to `standards.dnp.gov.pk`. The new host is linked from
  `pda.gov.pk`.
- `www.commerce.gov.pk` serves a Cloudflare "verify you are human" check to
  both curl and the browser. That check was not completed (CAPTCHA), so these
  URLs could not be confirmed live. They were treated as unconfirmable and
  replaced with captures of the exact URLs. The originals may still work for a
  human visitor.
- `www.pcp.gov.pk`, `lah.punjab.gov.pk` and the other Punjab hosts timed out
  from this network for both curl and the browser.
- Wayback timestamps are exact capture times taken from the CDX index. Each
  capture was opened, and its content checked, as stated in the table.
- Records whose sources were re-opened have `last_verified: 2026-10-10`. The
  Punjab RTI record keeps its earlier date because its source could not be
  opened. No `verification` or `status` value was changed. Records that were
  already `Unverified` stay `Unverified`. A working URL alone does not
  reconfirm current legal status, as `docs/data-quality.md` requires.

| # | record_id | field | original URL | what was found | action | new URL | how confirmed same document |
|---|---|---|---|---|---|---|---|
| 1 | wasl-reference-architecture-2026 | primary_source_url | https://standards.pda.gov.pk/dnp-d.002ra.html | Redirects to extensionless path, HTTP 404; host root is an Apache test page | replaced-live | https://standards.dnp.gov.pk/dnp-d.002ra.html | Page title "DNP-D.002 RA — WASL Reference Architecture"; "WASL — Pakistan National Data Exchange Layer: Reference Architecture"; publisher Pakistan Digital Authority; visible "PDA Standards Board (approved 13 May 2026)"; same filename on PDA's new standards host linked from pda.gov.pk |
| 2 | wasl-reference-architecture-2026 | secondary_sources[0] | https://standards.pda.gov.pk/ | HTTP 403 to curl; browser shows Apache/CentOS test page (site gone) | replaced-live | https://standards.dnp.gov.pk/ | Same PDA standards portal, now on the host linked from pda.gov.pk; lists DNP-D.002 RA and the other WASL documents |
| 3 | national-ai-policy-2025 | secondary_sources[1] | https://www.moitt.gov.pk/SliderDetail/NWIyMzEwYzktYTIwYy00ZTk0LWI5ODUtYjg5NjZmYTYyMTg2 | HTTP 500 (old GUID page removed) | replaced-archive | https://web.archive.org/web/20251203182949/https://moitt.gov.pk/SliderDetail/NWIyMzEwYzktYTIwYy00ZTk0LWI5ODUtYjg5NjZmYTYyMTg2 | Capture is the MoITT page announcing that the Federal Cabinet approved the AI Policy 2025 |
| 4 | personal-data-protection-bill-2023 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/Final%20Draft%20Personal%20Data%20Protection%20Bill%20May%202023.pdf | HTTP 404 | replaced-live | https://moitt.gov.pk/SiteImage/Legislations/Final%20Draft%20Personal%20Data%20Protection%20Bill%20May%202023%20(1).pdf | Byte-identical to Wayback capture 20250828214923 of the original (sha256 b7618948…); listed on moitt.gov.pk/Legislations as "Personal Data Protection Bill May 2023 - Draft", 01 May 2023 |
| 5 | personal-data-protection-bill-2023 | secondary_sources[0] | https://moitt.gov.pk/Detail/YjVmNzU0MWMtYzBkMC00Yjg5LTk1ODktOTJiODYzZTY5ZWRk | HTTP 500 (old GUID page removed) | replaced-archive | https://web.archive.org/web/20260213130107/https://moitt.gov.pk/Detail/YjVmNzU0MWMtYzBkMC00Yjg5LTk1ODktOTJiODYzZTY5ZWRk | Capture is the MoITT draft-legislation page listing "Draft - Personal Data Protection Bill May 2023" and linking the original PDF |
| 6 | software-development-export-strategy-2023-2027 | secondary_sources[0] | https://www.commerce.gov.pk/remit/ | HTTP 403; browser gets Cloudflare human check (not completed) | replaced-archive | https://web.archive.org/web/20260210080318/https://www.commerce.gov.pk/remit/ | Capture is the Ministry of Commerce "ReMIT" page; it links the Software Development strategy PDF (row 7) |
| 7 | software-development-export-strategy-2023-2027 | secondary_sources[1] | https://www.commerce.gov.pk/wp-content/uploads/2024/05/Software-Development-Export-Strategy-Pakistan-3_web-1.pdf | HTTP 403; Cloudflare human check | replaced-archive | https://web.archive.org/web/20250910144234/https://www.commerce.gov.pk/wp-content/uploads/2024/05/Software-Development-Export-Strategy-Pakistan-3_web-1.pdf | Capture is a PDF titled "Pakistan Export Strategy Software Development 2023-2027", Government of Pakistan, NPSES / ITC |
| 8 | national-cyber-security-framework-for-telecom-2022 | primary_source_url | https://ntcert.pta.gov.pk/sops/national_cs_framework_for_telecom_07-07-2022.pdf | Reachable with curl on 2026-10-10 (HTTP 200, application/pdf, 689,344 bytes); 9 Oct failure was transient | kept | (unchanged) | PDF cover: PTA, "National Cyber Security Framework for Telecom Assessment Criteria & Guidelines", Version 1.0, 15th June 2022 |
| 9 | removal-blocking-online-content-rules-2021 | primary_source_url | https://www.moitt.gov.pk/SiteImage/Misc/files/Final%20Draft%20Rules%20-%20RULES%20FOR%20REMOVAL%20AND%20BLOCKING%20OF%20UNLAWFUL%20ONLINE%20CONTENT%20%28PROCEDURE%2C%20OVERSIGHT%2C%20AND%20SAFEGUARDS%29%20RULES%2C%202020.pdf | HTTP 404 | replaced-live | https://moitt.gov.pk/SiteImage/Legislations/Final%20Draft%20RULES%20FOR%20REMOVAL%20AND%20BLOCKING%20OF%20UNLAWFUL%20ONLINE2020.pdf | Byte-identical to Wayback capture 20240513180206 of the original (sha256 eb4d744b…); listed on moitt.gov.pk/Legislations as the Rules 2020 draft |
| 9 | removal-blocking-online-content-rules-2020 | secondary_sources[0] | (same URL as above) | HTTP 404 | replaced-live | (same as above) | Same file as above |
| 9 | citizens-protection-online-harm-rules-2020 | secondary_sources[0] | (same URL as above) | HTTP 404 | replaced-live | (same as above) | Same file as above |
| 10 | removal-blocking-online-content-rules-2021 | secondary_sources[0] | https://moitt.gov.pk/Detail/MTBmMGQ3NDItOWM2Mi00N2M0LWE1ZGUtMjRlNWJlOGYwZGU0 | HTTP 500 (old GUID page removed) | replaced-archive | https://web.archive.org/web/20260213233649/https://moitt.gov.pk/Detail/MTBmMGQ3NDItOWM2Mi00N2M0LWE1ZGUtMjRlNWJlOGYwZGU0 | Capture is the MoITT "Rules" page; it links the 2021 rules, "Corrected Version of Rules" and the other rules PDFs |
| 11 | removal-blocking-online-content-rules-2021 | secondary_sources[1] | https://moitt.gov.pk/SiteImage/Downloads/MoITT-YB-21-22.pdf | HTTP 404; not listed on moitt.gov.pk/Publications | replaced-archive | https://web.archive.org/web/20251203022722/https://moitt.gov.pk/SiteImage/Downloads/MoITT-YB-21-22.pdf | Capture is the MoITT Year Book; text covers "FY 2021-22" and mentions the section 37(2) PECA "Removal and Blocking of Unlawful…" rules |
| 12 | balochistan-rti-act-2021 | secondary_sources[0] | https://dpr.gob.pk/wp-content/uploads/2023/11/BALOCHISTAN-right-to-information-act-2021.pdf | WordPress 404 in curl and browser, though DPR's document library still links it | replaced-archive | https://web.archive.org/web/20250812115253/https://dpr.gob.pk/wp-content/uploads/2023/11/BALOCHISTAN-right-to-information-act-2021.pdf | Scanned page 1 (rendered and read): Balochistan Provincial Assembly Secretariat notification dated 16 Feb 2021, "The Balochistan Right To Information Act, Act No. II of 2021", assented 15 Feb 2021 |
| 13 | import-export-ecommerce-rules-2021 | secondary_sources[0] | https://www.commerce.gov.pk/wp-content/uploads/2021/03/SRO14-2021_opt.pdf | HTTP 403; Cloudflare human check | replaced-archive | https://web.archive.org/web/20250623223852/https://www.commerce.gov.pk/wp-content/uploads/2021/03/SRO14-2021_opt.pdf | Capture is the FBR (Revenue Division) notification of 6 Jan 2021 that adds the e-commerce chapter to the Customs Rules, 2001 (S.R.O. 14(I)/2021) |
| 14 | import-export-ecommerce-rules-2021 | secondary_sources[1] | https://www.commerce.gov.pk/sros/ | HTTP 403; Cloudflare human check | replaced-archive | https://web.archive.org/web/20260308110142/https://www.commerce.gov.pk/sros/ | Capture is the Ministry of Commerce "SROS" page; it lists "Import and Export of E-Commerce Rules" and links SRO14-2021_opt.pdf |
| 15 | import-export-ecommerce-rules-2021 | secondary_sources[2] | https://www.pcp.gov.pk/SiteImage/Downloads/29%2821%29Ex%20Gaz-II.pdf | Connection timeout in curl; browser navigation failed | replaced-archive | https://web.archive.org/web/20220804031305/https://www.pcp.gov.pk/SiteImage/Downloads/29%2821%29Ex%20Gaz-II.pdf | Capture is the Gazette of Pakistan, Extraordinary, 9 Jan 2021, Part II, carrying S.R.O. 14(I)/2021 of 6 Jan 2021 (FBR, Customs) |
| 16 | public-private-right-of-way-policy-directive-2020 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/ROW%20Policy%20Directive%20.pdf | HTTP 404 | replaced-live | https://moitt.gov.pk/SiteImage/Policies/ROW%20Policy%20Directive%20.pdf | Byte-identical to Wayback capture 20250701092229 of the original (sha256 56a8001b…); Gazette of Pakistan Extraordinary, 31 Dec 2020, MoITT notification; listed on moitt.gov.pk/Policies |
| 17 | public-private-right-of-way-policy-directive-2020 | secondary_sources[0] | https://moitt.gov.pk/Detail/ZTA5MTI4ZWUtMzdhMS00ZDRhLWE0YmUtZjJjNThhYTdjNzdl | HTTP 500 (old GUID page removed) | replaced-archive | https://web.archive.org/web/20260217035557/https://moitt.gov.pk/Detail/ZTA5MTI4ZWUtMzdhMS00ZDRhLWE0YmUtZjJjNThhYTdjNzdl | Capture is the MoITT "Policies & Plan" page; it links "ROW Policy Directive .pdf" and "Telecommunications Policy -2015 APPROVED.pdf" |
| 17 | telecommunications-policy-2015 | secondary_sources[2] | (same URL as above) | HTTP 500 | replaced-archive | (same as above) | Same capture as above |
| 18 | public-private-right-of-way-policy-directive-2020 | secondary_sources[1] | https://moitt.gov.pk/NewsDetail/YWU1NWUwNjUtOWEzNS00MzQzLTgzZGQtYTZmZDc4NjdiNmUy | HTTP 500 (old GUID page removed) | replaced-archive | https://web.archive.org/web/20241103123350/https://moitt.gov.pk/NewsDetail/YWU1NWUwNjUtOWEzNS00MzQzLTgzZGQtYTZmZDc4NjdiNmUy | Capture is MoITT news item "Approval of RoW Policy by federal cabinet a historical success of MOIT&T" |
| 19 | removal-blocking-online-content-rules-2020 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/Corrected%20Version%20of%20Rules.pdf | HTTP 404 | replaced-live | https://moitt.gov.pk/SiteImage/Legislations/unlawfull%20online%20content%202020.pdf | Byte-identical to Wayback capture 20220622175630 of the original (sha256 47862831…); S.R.O. 1077(I)/2020, MoITT, 6 Oct 2020 |
| 20 | citizens-protection-online-harm-rules-2020 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/CP%20%28Against%20Online%20Harm%29%20Rules%2C%202020.pdf | HTTP 404; not listed on moitt.gov.pk/Legislations | replaced-archive | https://web.archive.org/web/20260224053935/https://moitt.gov.pk/SiteImage/Misc/files/CP%20%28Against%20Online%20Harm%29%20Rules%2C%202020.pdf | Capture is the MoITT notification dated 21 January 2020 making the Citizens Protection rules under the PTA Act and PECA |
| 21 | ecommerce-policy-pakistan-2019 | primary_source_url | https://www.commerce.gov.pk/wp-content/uploads/2019/11/e-Commerce_Policy_of_Pakistan_Print.pdf | HTTP 403; Cloudflare human check. Wayback captures are truncated (1 MB and 5 MB) and unreadable | replaced-live | https://tdap.gov.pk/wp-content/uploads/2022/01/6-E-Commerce-Policy-2019-24.pdf | Official TDAP copy: cover "e-Commerce Policy of Pakistan, October 2019, Government of Pakistan, Commerce Division", 60 pages, PDF created 13 Nov 2019 (matches the original's 2019/11 upload). Not byte-compared because the original's captures are truncated |
| 22 | ecommerce-policy-pakistan-2019 | secondary_sources[0] | https://www.commerce.gov.pk/ecommerce-policy-2019/ | HTTP 403; Cloudflare human check | replaced-archive | https://web.archive.org/web/20260401094411/https://www.commerce.gov.pk/ecommerce-policy-2019/ | Capture is the Ministry of Commerce page "e-Commerce Policy of Pakistan"; it links e-Commerce_Policy_of_Pakistan_Print.pdf |
| 23 | telecommunications-policy-2015 | secondary_sources[1] | https://moitt.gov.pk/SiteImage/Misc/files/ECC%20Approval%20of%20Telecom%20Policy%202015%20.pdf | HTTP 404; not on current MoITT site | replaced-archive | https://web.archive.org/web/20240917083728/https://moitt.gov.pk/SiteImage/Misc/files/ECC%20Approval%20of%20Telecom%20Policy%202015%20.pdf | Capture is the MoITT note "ECC Approves the Telecommunications Policy 2015", ECC meeting of 11 December 2015 |
| 24 | broadband-quality-of-service-regulations-2014 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/2_%20Broadband%20Quality%20of%20Service%20Regulations%2C%202014.pdf | HTTP 404; not on moitt.gov.pk/Legislations; pta.gov.pk unreachable from this network | replaced-archive | https://web.archive.org/web/20241103123659/https://moitt.gov.pk/SiteImage/Misc/files/2_%20Broadband%20Quality%20of%20Service%20Regulations%2C%202014.pdf | Scanned page 1 (rendered and read): Gazette of Pakistan Extraordinary, 13 Aug 2014; PTA notification S.R.O. 731(I)/2014 dated 27 June 2014, "Broadband Quality of Service Regulations, 2014" |
| 25 | punjab-transparency-rti-act-2013 | primary_source_url | https://lah.punjab.gov.pk/system/files/RIGHT%20TO%20INFORMATION%20ACT%202013.pdf | Connection timeout in curl and browser; all Punjab hosts tried (lah, punjabcode, pap, pic, punjablaws) unreachable from this network; no Wayback 200 capture of this URL | record-unverified | (unchanged) | Not confirmed. The record was already `Unverified`/`Unverified` and stays so. The URL is kept because the host is unreachable, not proven dead; recheck from a Pakistani network |
| 26 | pakistan-telecommunication-rules-2000 | primary_source_url | https://moitt.gov.pk/SiteImage/Misc/files/Pakistan%20telecom%20rules.pdf | HTTP 404 | replaced-live | https://moitt.gov.pk/SiteImage/Legislations/Pakistan%20telecom%20rules.pdf | Byte-identical to Wayback capture 20241103142440 of the original (sha256 e19e1adf…); Gazette Extraordinary 27 Nov 2000, S.R.O. 847(I)/2000 of 2 Nov 2000. MoITT's listing labels this file "Access Promotion Contribution Rules, 2004", but the file itself is the 2000 rules |

## Counts (per reference, 29 total)

- kept: 1
- replaced-live: 10 (8 distinct URLs)
- replaced-archive: 17 (16 distinct URLs)
- removed: 0
- record-unverified: 1 (record was already Unverified; nothing changed)

## Items for a human editor (no change made)

- `removal-blocking-online-content-rules-2021` uses the undated MoITT final
  draft as its primary source. The notified 2021 rules (S.R.O. 1343(I)/2021)
  are now at
  `https://moitt.gov.pk/SiteImage/Legislations/Removal%20Blocking%20of%20Unlawful%20Online%20Content%20Rules%202021.pdf`.
  Out of scope here: only the dead URL was repaired.
- The WASL page's JSON-LD says `datePublished: 2025-05-13`, but the visible
  approval date is 13 May 2026, which matches the record. Dates were not touched.
- The commerce.gov.pk URLs (rows 6, 7, 13, 14, 22) may still work for a human
  visitor who passes Cloudflare. If an editor confirms that by hand, the
  originals can be restored.
