#!/usr/bin/env bash
# One-time AWS setup for the GitHub Actions deploy pipeline.
#
# Run as an admin (the `alex` IAM user), for example in AWS CloudShell:
#   git clone https://github.com/avbaro/personal-website && cd personal-website
#   bash infra/setup.sh
#
# Safe to re-run: steps that already exist are skipped.
set -euo pipefail
cd "$(dirname "$0")"

ACCOUNT=836766487061
BUCKET=www.alexanderbaro.com
ROLE=github-deploy-personal-website
OIDC_ARN="arn:aws:iam::${ACCOUNT}:oidc-provider/token.actions.githubusercontent.com"

caller=$(aws sts get-caller-identity --query Arn --output text)
echo "Running as: $caller"
case "$caller" in
  *:root) echo "Refusing to run as root. Sign in as the alex IAM user."; exit 1 ;;
esac

echo "1/5 GitHub OIDC identity provider"
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" >/dev/null 2>&1; then
  echo "    already exists"
else
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com >/dev/null
  echo "    created"
fi

echo "2/5 Deploy role ($ROLE), trusted only by avbaro/personal-website on master"
if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE" --policy-document file://deploy-trust-policy.json
  echo "    already exists, trust policy refreshed"
else
  aws iam create-role --role-name "$ROLE" \
    --assume-role-policy-document file://deploy-trust-policy.json \
    --description "GitHub Actions deploy for www.alexanderbaro.com" \
    --max-session-duration 3600 >/dev/null
  echo "    created"
fi

echo "3/5 Deploy permissions (site bucket + invalidations only)"
aws iam put-role-policy --role-name "$ROLE" --policy-name deploy-site \
  --policy-document file://deploy-permissions-policy.json
echo "    applied"

echo "4/5 S3 versioning on $BUCKET (undo for bad deploys)"
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
echo "    enabled"

echo "5/5 Expire old versions after 30 days"
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration file://site-bucket-lifecycle.json
echo "    applied"

echo
echo "Done. Role ARN: arn:aws:iam::${ACCOUNT}:role/${ROLE}"
