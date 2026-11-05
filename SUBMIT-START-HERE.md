# Submit LotLine · field-by-field checklist

The deadline is **November 7, 2026 at 11:59 PM IST**. Submit manually from your registered account.

## Step 1 · Get the two required URLs

1. **Public GitHub repository.** Extract `lotline-source.zip`. On GitHub, create a public repository called `lotline`, then choose **Add file → Upload files** (or the upload link on an empty repo). Upload the extracted contents, with `README.md` and the `src`, `switch`, `fixtures`, `test` and `workbench` folders at the root. Commit the upload. Copy the repo's main page URL. You can do this entirely in your browser.
2. **Public or unlisted YouTube or Loom video.** Give the ZIP and `SUBMISSION.md` to a teammate or someone running a remote Switch setup. Record a real Mattermost thread showing the person's request, the Switch agents' draft and audit, the person's supplier decision and the final action sheet. Keep it under three minutes, upload it to YouTube or Loom, and copy its watch link. The 23-second browser workbench MP4 is supplemental. Use it in the required video field only if the organizers confirm an exception. The live recording has not been produced.

[Remote Switch setup](https://docs.switchagents.ai/switch-rooms/deploy/self-host)

## Step 2 · Project Details

Open the [submission form](https://www.wemakedevs.org/hackathons/switch/submit) and fill in the fields in this order.

| Field | What to enter |
| --- | --- |
| Project title | LotLine — Recall Triage in Team Chat |
| Tracks you are submitting for | Best Business Workflow |
| Project description | Paste the text below |
| GitHub Repository or contribution | The public GitHub repo URL from Step 1 |
| Demo video | The YouTube or Loom watch URL from Step 1 |
| Live demo or deployment | Leave blank unless you have a hosted demo URL |

**Project description**

> When a supplier issues a recall, small retailers need to know which stores and warehouses actually have the affected lot. LotLine turns that review into one Mattermost thread. One agent reconciles the inventory, a second checks the source rows, and an operations lead resolves an ambiguous lot against supplier evidence. The result is an internal action sheet with affected locations, quantities, source record IDs and the operator's decision.

## Step 3 · Track Details

For the Business Workflow entry, leave **Pull requests**, **Blog post**, **Your Wispr usage card**, and **Your #HowISwitch post** blank. These are for separate tracks or prizes. The form does not require a slide deck.

## Step 4 · How you used Switch

**How did you use Switch in your project?**

Use this version after a real run that matches it. Change Codex or Mattermost if the recording uses something else.

> LotLine uses a Switch room template to configure two Codex agents in Mattermost. A retail operations lead requests a recall review in the room. The reconciliation agent classifies shipment and stock records, and the audit agent independently checks the draft and posts a receipt tied to those records. The operations lead cites supplier evidence to resolve the ambiguous lot in the same thread. The reconciliation agent then posts the internal action sheet. If the export changes after the audit, LotLine requires a new review.

**What did you like about Switch, and what would you improve?**

Use this if it matches the actual run. Add one concrete observation from whoever recorded it.

> I liked that the operator could see the reconciliation, audit and decision in a single thread. I would add a template preflight that checks whether each agent can run Node.js and read the project directory before creating the room. That would make it easier for someone else to reproduce the workflow.

If the organizers approve the browser-only video, describe the Switch template as configured for Codex and Mattermost and explicitly say the video shows a local preview, with the live workflow unverified.

## Step 5 · Submit

Verify the repository and video URLs in a signed-out browser window. Confirm all seven required fields are filled, click **Submit project**, and check for the confirmation. The captured form says you can edit your submission until the deadline.

[Official rules](https://www.wemakedevs.org/hackathons/switch/rules) · [Hackathon overview](https://www.wemakedevs.org/hackathons/switch)
