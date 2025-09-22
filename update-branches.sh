#!/bin/bash

# Function to update a branch
update_branch() {
  local branch=$1
  if git rev-parse --verify $branch >/dev/null 2>&1; then
    echo "Updating branch: $branch"
    git checkout $branch
    git pull origin $branch
  else
    echo "Branch $branch does not exist locally. Skipping."
  fi
}

# Stash any local changes to avoid conflicts (optional; comment out if not needed)
git stash

# Fetch all remote changes first
git fetch origin

# Update main and develop
update_branch main
update_branch develop

# Switch to develop branch
git checkout develop

# Apply stashed changes if any (optional)
git stash pop