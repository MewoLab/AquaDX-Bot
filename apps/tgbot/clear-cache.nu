let tmpfile = mktemp -t --suffix .json
wrangler kv key list --remote --namespace-id 16a7f633b5374174a3e44a4ebd4abac6 --prefix image: | from json | get name | to json | save -f $tmpfile
wrangler kv bulk delete --remote --namespace-id 16a7f633b5374174a3e44a4ebd4abac6 -f $tmpfile
let tmpfile = mktemp -t --suffix .json
wrangler kv key list --remote --namespace-id 16a7f633b5374174a3e44a4ebd4abac6 --prefix lyrics: | from json | get name | to json | save -f $tmpfile
wrangler kv bulk delete --remote --namespace-id 16a7f633b5374174a3e44a4ebd4abac6 -f $tmpfile
rm $tmpfile
