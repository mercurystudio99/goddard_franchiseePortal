# Recovery script for retrieving the rendition of a faculty bio asset
#
# This script requires a .csv of the FacultyCorruptedAssets file
# An example looks like:
# ./FacultyCorruptedAssets.csv 
#  Schoolid,EmployeeID,Filepath
#  10100761742,10100878117,
#  10100761742,11862737567,
#
# Then you will also need to aquire an APIM Subscription key to be stored in ./apim-subscription-key.txt
# Format of this file is a simple string:
# ./apim-subscription-key.txt
#  abcdefg
# 
import csv
import urllib.request
import json
from urllib.error import HTTPError

ocpApimSubscriptionKey = ''
with open('./apim-subscription-key.txt', encoding='utf-8') as secrets:
    ocpApimSubscriptionKey = secrets.read().replace('\n','')

with open('./FacultyCorruptedAssets.csv', newline='') as csvfile:
    with open('./FacultyCorruptedAssets_WithUrl.csv', "a") as outfile:
        dr = csv.DictReader(csvfile, delimiter=',')
        for row in dr:
            eid = row['EmployeeID']
            req = urllib.request.Request('https://ipaas-prod-useast-apim.azure-api.net/faculty/api/v1/faculty/{id}'.format(id=eid),
                                         None,
                                         {'Ocp-Apim-Subscription-Key': ocpApimSubscriptionKey})
            try:
                res = urllib.request.urlopen(req)
            except(HTTPError):
                csvrow = "{a},{b},{c}\n".format(a=row['Schoolid'],b=eid,c='')
                outfile.write(csvrow)
                continue
            data = res.read()
            api_data = json.loads(data)
            csvrow = "{a},{b},{c}\n".format(a=row['Schoolid'],b=eid,c=api_data['photoUrl'])
            outfile.write(csvrow)
