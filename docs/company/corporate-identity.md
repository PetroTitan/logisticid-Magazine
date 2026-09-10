# LogisticID — corporate identity

> The canonical record of who the company is, shared byte-for-byte between the
> main site and the Magazine. Both repositories hold an identical copy of this
> file, and both run a test that fails if their own configuration disagrees
> with it.

## Why this file exists

The two applications serve one hostname and one company. They are separate
repositories with separate deployments, so nothing forces them to say the same
thing about the entity that publishes both — and a reader who sees
`LogisticID s.r.o.` in the site footer and a different company number in the
Magazine footer has no way to tell which is wrong.

There is no shared package to import, and creating one to carry six strings
would couple two deployments that are deliberately independent. So the shared
artefact is this document, and each repository proves its own configuration
against it.

**This file is not the source of truth for the main site.**
`src/config/corporate-identity.ts` is: it carries each fact with its evidence,
the authority that issued it, how it was checked and on what day, and it
refuses to publish a fact whose provenance cannot support the claim. This file
is a projection of that registry into a form the Magazine can also check
itself against. When a fact changes, change the registry, then this file, then
copy this file into the other repository.

## Canonical values

```
legal_name = LogisticID s.r.o.
registration_number = 29957516
registered_office_street = Petrská 1166/33, Nové Město
registered_office_postal_code = 110 00
registered_office_locality = Praha 1
registered_office_country = CZ
registered_office_one_line = Petrská 1166/33, Nové Město, 110 00 Praha 1, Czech Republic
jurisdiction = Czech Republic
registry = Obchodní rejstřík vedený Městským soudem v Praze
registry_file_number = C 455016
incorporation_date = 2026-09-03
vat_registered = no
primary_email = contact@logisticid.com
canonical_domain = logisticid.com
```

The block above is parsed by a test in each repository. Keep it as `key =
value` lines with single spaces around the `=`, and put explanation in prose
rather than in the block.

## What each value means, and what it does not

### `registration_number` is an IČO, and it is not a VAT number

`29957516` is the Czech company identification number. A Czech DIČ for a legal
person is written as `CZ` followed by exactly that number, which makes
`CZ29957516` trivially constructible and permanently tempting.

**It must never be published.** The string is only a VAT number if the tax
authority has registered the company for VAT. The Financial Administration's
register of VAT payers was queried for `29957516` on 4 September 2026 and
answered that no VAT-payer record exists. So `vat_registered = no` is not
"nobody checked" — it is a recorded negative, and `taxNumber` in the main
registry carries that answer as its reason for being absent.

A VAT number may be added here only when a registration certificate exists.
Not when the company registers for VAT in future and somebody assumes the
number; the number has to be read off the authority's own record.

### `registered_office_*` is a seat, not a place of business

It is the address at which documents can be served on the company. It is
**not** a warehouse, a logistics terminal, a customer office, an operating
depot, a branch or a place any visitor should travel to. LogisticID arranges
transport that independent carriers perform; it operates no facility at this
address or anywhere else.

Consequences that both repositories enforce:

- No `LocalBusiness` structured data. `LocalBusiness` asserts a place customers
  attend, which would turn a registered seat into a Prague branch.
- No geo coordinates, no opening hours, no `areaServed`.
- The street line does not appear in either footer. Locality is enough where a
  jurisdiction needs to be visible.

`Nové Město` is the cadastral district and is part of the register's own
rendering of the address. It sits in the street line because schema.org's
`PostalAddress` has no field for a district and `addressRegion` is not one.

### `primary_email` is owner-declared, not delivery-tested

`contact@logisticid.com` is the address the owner of the domain and of the
company designates as the corporate contact address. It serves general
enquiries, quote requests, carrier introductions and privacy or legal
correspondence — one mailbox, four public purposes.

The main repository records it as `declared` rather than `verified`, because
nobody has yet sent a message to it from outside and watched it arrive. The
distinction is machine-readable: `hasTestedDelivery()` returns `false`. Nothing
in either application may claim verified mailbox delivery. `docs/CONTACT-CHANNELS.md`
in the main repository sets out how to upgrade it.

No other mailbox on the domain is published. `info@`, `quotes@`, `carriers@`,
`legal@`, `privacy@`, `support@` and `billing@` do not exist as far as either
repository knows, and a list of desirable addresses has a way of becoming a
list of published ones.

### `canonical_domain` is the only public identity

Both applications serve `logisticid.com`; the Magazine is reached at
`logisticid.com/magazine/*` through a rewrite and has no public domain of its
own. Railway, Netlify and Vercel hostnames are infrastructure and are refused
as canonical origins by both repositories.

### `incorporation_date` is a fact and not a founding story

The company was entered in the Commercial Register on 3 September 2026. It is
recorded here and deliberately not emitted as `foundingDate` in structured
data: a founding date on a company this new reads as heritage, and answers no
question a reader has.

## Facts that are deliberately absent

| Field | Why it is not here |
| --- | --- |
| VAT / DIČ | Not registered. See above. |
| Telephone | No business line exists. |
| Bank details | Never published on a website. |
| Directors and owners | Public in the register; this site states no person, and no team member is published. |
| Business authorisations | The company is registered for the forwarding field of activity and holds no road transport concession. The full activity list is not published; a website is not a register extract. |
| `sameAs` profiles | No official company profile has been supplied. |

## Changing anything here

1. Change `src/config/corporate-identity.ts` in the main repository, with the
   evidence for the new value — the authority, how it was checked, and the
   date it was read.
2. Update the canonical block above.
3. Copy this file into the Magazine repository unchanged.
4. Run the test suite in both. The parity tests fail on any disagreement, in
   either direction.
