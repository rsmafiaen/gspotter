---
name: auto-pr
description: Create a PR for the project
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
  opencode/slash: true
---

## What the skill does

- Create a github pull request for the current changes
- Compare the remote head of main to the local changes
- Create a new branch and ask about uncommited changes if necessary

## Workflow
1. Run a git diff comparing the current working tree to the head of the remote main
  a. Get a good understanding of the changes made
2. Check that the current branch is NOT main
  a. If the current branch is main, ask the user for what they want the new branch name to be, then create the branch. If they do not specify, find a good, descriptive name. There are no branch naming conventions in the project. Use a somewhat consice, name which describes the overall changes being made.
  b. If there are local commits on main that are not present on the remote, move the commits to the new branch. The branch protection will not allow for the changes to be made to main without a PR and review.
3. If there are uncommited changes, ask the user if they want to commit them. Repeat a similar process to step 2 to ask about what the commit message should be, and create a descriptive one if the user wishes/does not specify. Split the changes into multiple commits if it makes the changes clearer.
4. Plan the pull request
  a. Create a consice, fitting, descriptive title. If there is only one commit in the diff, use the commit message of the sole commit.
  b. Create a description. Use bullet points to describe what changes in an easy-to-read manner.
5. Run `gh pr create -a="@me"` to create a new pull request. Set `main` as the head, unless otherwise specified. Mark the PR as a draft unless the user specifies it should be mergable in the inital prompt (e.g. "/auto-pr mergable", "/auto-pr not draft" or "/auto-pr the PR should not be a draft" or similar)

## Dos and donts
DO:
  - Ask for clarification if there are any changes you are unsure of how to categorize
  - Use context from the chat history if available to discern what the scope of the changes are
  - Ensure the PR is made to the correct repository. The repository link is "git.ntnu.no/IT2810-H26/T09-Project-2"
  - Read the online github cli manual for the `gh pr create` command, found at "https://cli.github.com/manual/gh_pr_create"
DONT:
  - Make commits or change branches without asking the user for confirmation, or ensuring the inital prompt was VERY CLEAR in the intention that you should
