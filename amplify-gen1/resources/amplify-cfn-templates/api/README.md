Put this file in the `amplify-rms-alpha-XXXXXX-deployment/amplify-cfn-templates/api` folder to output the name of
Amplify Datastore generated tables. This is so that we can pick them up and then directly write to them in functions.

On any Datastore changes, these steps are required:
1. Remove functions dependency on the api tables in `amplify/backend/backend-config.json`
2. Amplify Push with new changes.
3. Put this file up in S3.
4. Manual CloudFormation update for the `apirms` resource.
5. Revert step 1
6. Amplify Push again.