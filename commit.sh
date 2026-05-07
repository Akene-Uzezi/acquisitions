set -e

echo "Staging changes..."
git add .
read -p "Enter commit message: " commit_message
echo "Committing changes..."
git commit -m "$commit_message"
read -p "Do you want to push the changes? (y/n) " push_response
if [ "$push_response" = "y" ]; then
  echo "Pushing changes..."
  git push
else
  echo "Changes committed but not pushed."
fi
