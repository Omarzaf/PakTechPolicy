# Packet B sourcing notes

Checked: 2026-07-25  
Domains: Telecom regulation; Cybersecurity  
Records: 13 total — 5 telecom-only, 6 cybersecurity-only, and 2 cross-domain.

## Primary sources checked

- Pakistan Code: [Pakistan Telecommunication (Re-organization) Act, 1996](https://pakistancode.gov.pk/pdffiles/administratorcf6de2451af9e9d016e5fef2ac7e1562.pdf). The consolidated official text was opened and checked; it carries an RGN date of 2024-11-19.
- Ministry of IT & Telecom: [Pakistan Telecommunication Rules, 2000](https://moitt.gov.pk/SiteImage/Misc/files/Pakistan%20telecom%20rules.pdf). The official indexed text was checked, but a direct fetch returned HTTP 404 during this research pass.
- PKCERT: [Telecommunications Policy 2015](https://pkcert.gov.pk/uploads/2023/06/2015-Telecommunications-Policy-APPROVED.pdf). The complete official PDF was opened and checked.
- Ministry of IT & Telecom: [Broadband Quality of Service Regulations, 2014](https://moitt.gov.pk/SiteImage/Misc/files/2_%20Broadband%20Quality%20of%20Service%20Regulations%2C%202014.pdf). The official indexed gazette text was checked, but a direct fetch returned HTTP 404 during this research pass.
- Ministry of IT & Telecom: [Public & Private Right of Way Policy Directive](https://moitt.gov.pk/SiteImage/Misc/files/ROW%20Policy%20Directive%20.pdf). The official indexed gazette text was checked, but a direct fetch returned HTTP 404 during this research pass.
- PKCERT: [Critical Telecom Data and Infrastructure Security Regulations, 2020](https://pkcert.gov.pk/uploads/2023/06/critical_telecom_data_reg_20112020.pdf). The complete official gazette PDF was opened and checked.
- PKCERT: [National Cyber Security Policy 2021](https://pkcert.gov.pk/uploads/2023/06/2021-National-Cyber-Security-Policy-Final.pdf). The complete official PDF was opened and checked.
- PKCERT: [Computer Emergency Response Team Rules, 2023](https://pkcert.gov.pk/uploads/2023/10/GAZETTE-CERT-Rules-2023.pdf). The complete official gazette PDF was opened and checked.
- PKCERT: [Policy for Evaluation of Algorithms and Security Devices](https://pkcert.gov.pk/uploads/2023/06/evaluation-policy-20-3-2020.pdf). The complete official PDF was opened and checked.
- PTA National Telecom CERT: [National Cyber Security Framework for Telecom — Assessment Criteria & Guidelines](https://ntcert.pta.gov.pk/sops/national_cs_framework_for_telecom_07-07-2022.pdf). The complete official PDF was opened and checked.
- PKCERT: [PSS ITSec Guide Book](https://pkcert.gov.pk/uploads/2024/07/public_pss_itsec_guidebook_01-03-2024.pdf). The complete official PDF was opened and checked.
- PKCERT: [PSS Crypto Guide Book](https://pkcert.gov.pk/uploads/2024/07/public_pss_crypto_guidebook_01-03-2024.pdf). The complete official PDF was opened and checked.
- PKCERT: [Pakistan Information Security Framework](https://pkcert.gov.pk/uploads/2026/03/PISF-Merged-Version.pdf). The complete official PDF was opened and checked.
- Current official indexes were also checked: [MoITT policies](https://moitt.gov.pk/Detail/ZTA5MTI4ZWUtMzdhMS00ZDRhLWE0YmUtZjJjNThhYTdjNzdl), [MoITT regulations](https://moitt.gov.pk/Detail/Y2VjM2U3YzMtM2I0YS00Nzc2LThmZTAtMzNhMGY2OTZjZmI3), and [PKCERT policies and legislation](https://pkcert.gov.pk/policies-and-legislation.asp).

## Date precision and status notes

- The Act date is the date printed in the consolidated official text: 1996-10-13.
- The Rules, Broadband QoS Regulations, Right of Way Directive, CTDISR, and CERT Rules use the notification date printed in the official gazette text, not the later gazette-publication date.
- The Telecommunications Policy date is the date shown in the current MoITT policy index.
- The National Cyber Security Policy date is the date shown in the current MoITT policy index; its PDF cover states only July 2021.
- The security-device evaluation policy date is printed in the official filename and is consistent with the PDF creation date; no separate date line appears in the document body.
- The PSS guidebooks state a date of issue of 2023-06-14. Their current public URLs sit under a 2024 upload path, which is not treated as the enactment date.
- The PISF PDF does not print a publication date. Only the publication year is independently available from the official URL/current publication context, so `2026-01-01` is used under the schema's year-only rule.
- The Pakistan Telecommunication Rules, Broadband QoS Regulations, and Right of Way Directive are marked `Unverified` for both status and verification because their direct official PDFs could not be opened during this pass. No inference of current legal effect was made from an old gazette alone.
- Other records are marked `In force` only where the instrument was opened and a current official Pakistan government index or the instrument's current operative language supported that status.

## Unresolved questions for consolidation QA

- Recheck whether MoITT restores direct access to the three PDFs currently returning 404. Until then, retain their `Unverified` labels.
- Confirm whether any post-2000 amendments to the Pakistan Telecommunication Rules should be represented as a consolidated amendment date.
- PTA's 2022 annual-report material says the Authority reviewed the 2014 Broadband QoS Regulations and issued revised Fixed Broadband Quality of Service Regulations, 2022. Obtain and check the direct official 2022 instrument before assigning the 2014 instrument a superseded or repealed status.
- Confirm the exact formal publication date of the Pakistan Information Security Framework; the source establishes 2026 but does not print a day or month.
- The PSS guidebooks say product conformance becomes mandatory from 1 June 2028. Consolidation should not describe that future mandate as already effective, even though the issued standards and transition guidance are current.
