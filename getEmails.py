import pandas as pd
import numpy as np

df = pd.read_csv('sbu.csv')
undergrad_sbu = df[df.iloc[:, 2] == 'Undergraduate']
samplePercent = max(1, int(len(undergrad_sbu) * 0.01))
selected = undergrad_sbu.sample(n=samplePercent)

selected_emails = selected.iloc[:, 1]
selected_emails.to_csv('selected_emails.csv', index=False, header=False)

df = df.drop(selected.index)

df.to_csv('modified_sbu.csv', index=False)