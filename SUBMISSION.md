# LotLine submission kit

## Demo plan · 2 minutes 20 seconds

Record the real Mattermost channel. Use the synthetic fixture and run a rehearsal in a separate thread first. Frame the agent names and the human author so viewers can tell who made each decision. Trim waiting time while preserving the original replies and their order.

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:20 | The supplier notice and the two visually similar lot codes | “Northstar recalled K7-202. Our shipment export also has K7-20Z. Guess wrong and Hill Store's 40 units disappear from the action sheet.” |
| 0:20–0:48 | The operator's mention, then the reconciler's draft | “Switch routes the request to Codex. The calculation finds 36 shipped and 18 in stock. Another 46 units need a decision.” |
| 0:48–1:15 | The reconciler's handoff and the audit agent's independent check | “The second agent recalculates from the original rows. Its receipt ties the result to this draft, including the two uncertain rows and the excluded SKU.” |
| 1:15–1:45 | Post the operator decision in the same thread | “I have a simulated supplier addendum. I confirm K7-20Z is in scope and cite the addendum in chat.” |
| 1:45–2:10 | The final sheet. Point to Hill Store, West DC and the excluded toaster row | “The sheet now covers 76 shipped and 24 in stock. Hill Store goes to store ops, West DC goes to the warehouse team, and the toaster stays outside scope.” |
| 2:10–2:20 | Switch Console showing the bridged room and two agents | “The next shift can open one thread and see the source rows, independent check and human decision.” |

In rehearsal, check that the second agent answers the reconciler's mention, that the final post stays in the same thread, and that the decision post comes from the linked deployer and the sheet contains the configured operator label. Use the manual audit mention in the README if needed, and describe the handoff you actually show. If switching provider, replace “Codex” in the script with its actual name.

## Form fields

**Project title**

LotLine — Recall Triage in Team Chat

**Track**

Best Business Workflow

**Project description**

When a supplier issues a recall, small retail teams have to connect lot codes to stock and shipments before they can tell stores and warehouses what to do. LotLine turns that review into one Mattermost thread. One agent reconciles the records, a second checks the source rows, and the operations lead resolves a questionable lot against supplier evidence. The result is an internal action sheet with affected destinations, unit counts, record IDs and the human decision.

**GitHub repository**

Publish the project files in a public GitHub repository and paste the repository URL. The ZIP is a source bundle for unpacking and publishing.

**Demo video**

Paste a public or unlisted YouTube or Loom link for the real chat recording. Keep it under three minutes. The live deployment URL is optional.

**How did you use Switch?**

Use this draft after verifying the real run and adjust the provider or handoff if needed.

> I connected two Codex agents to a private Mattermost channel through Switch. A room template creates both agents, adds the operator, and gives everyone the same recall scope policy. Switch routes the operator's request and the agent handoff. One agent runs a deterministic lot reconciliation, and the other checks the raw records independently and posts a receipt tied to the draft. Finalization rejects a changed export or a mismatched receipt. The operator posts supplier evidence in the same thread to resolve the questionable lot, and the reconciliation agent publishes the action sheet there.

**What did you like about Switch, and what would you improve?**

Personalize this after rehearsal with one thing that worked and one thing you encountered. A possible improvement to evaluate is a template preflight that verifies whether both agents can access the project directory and the Node executable before creating the room.

## Before submitting

- Verify the draft, independent audit receipt, human decision and final sheet in Mattermost. Use a separate rehearsal thread to test a decision before PASS.
- Publish the source and README in a public repo. Check the URL signed out.
- Upload the real demo. Check the video URL signed out.
- Submit manually by **November 7, 2026 at 11:59 PM IST**. The official rules require manual participation and submission.

[Submission form](https://www.wemakedevs.org/hackathons/switch/submit) · [Official rules](https://www.wemakedevs.org/hackathons/switch/rules) · [Hackathon overview](https://www.wemakedevs.org/hackathons/switch)
