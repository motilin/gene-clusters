import os
import pandas as pd

# the case of TCGA-IB-7651
csv = pd.read_csv('./preprocess/mutationsFiltered.csv')
csv.columns
csv[csv['sample_id'] == "TCGA-IB-7651"]['drug']
csv.groupby('sample_id').count().sort_values('symbol', ascending=False)

DIR = "C:/Users/user/OneDrive - NewStem/Motti"
LOF = ['Frame_Shift_Del', 'Nonsense_Mutation', 'Frame_Shift_Ins']
MISSENSE = ['Splice_Region', 'In_Frame_Ins', 'Splice_Site', 'In_Frame_Del', 'Translation_Start_Site', 'Missense_Mutation']
RESISTANT = ["Clinical Progressive Disease", "Stable Disease"]
SENSITIVE = ["Complete Response", "Partial Response"]

mutations = pd.read_csv(DIR + "/" + "mutationsFiltered.csv")
clinical_data = pd.read_csv(DIR + '\clinical_data_TCGA_fixed.csv')

mutations['Tumor_Sample_Barcode'] = mutations['Tumor_Sample_Barcode'].str[0:12]
mutations = mutations.join(clinical_data.set_index('sample_id'), on='Tumor_Sample_Barcode')
mutations = mutations[['Hugo_Symbol', 'Variant_Classification', 'Tumor_Sample_Barcode', 'PolyPhen', 'IMPACT', 't_depth', 't_alt_count', 'Drug_name', 'Response', 'indication']]
mutations.columns = ['symbol', 'variant_classification', 'sample_id', 'polyPhen', 'impact', 't_depth', 't_alt_count', 'drug', 'response', 'indication']

mutations = mutations[mutations['t_depth'] >= 20]
mutations['t_alt_frac'] = mutations['t_alt_count'] / mutations['t_depth']
mutations = mutations[mutations['t_alt_frac'] >= 0.1]

mutations['var_type'] = 'other'
mutations.loc[mutations['variant_classification'].isin(LOF) ,'var_type'] = 'LOF'
mutations.loc[mutations['variant_classification'].isin(MISSENSE) ,'var_type'] = 'missense'

mutations['response_group'] = 'other'
mutations.loc[mutations['response'].isin(RESISTANT), 'response_group'] = 'resistant'
mutations.loc[mutations['response'].isin(SENSITIVE), 'response_group'] = 'sensitive'

Pts_w_few_mutations = mutations.groupby('sample_id').count()['symbol'] <= 1000
Pts_w_few_mutations = Pts_w_few_mutations[Pts_w_few_mutations].index.tolist()
mutations = mutations[mutations['sample_id'].isin(Pts_w_few_mutations)]

mutations = mutations[~mutations['drug'].isna()]
PTX_indications = mutations[mutations['drug'].str.contains('paclitaxel', case=False)]['indication'].unique().tolist()
Pts_w_PTX_indications = mutations[mutations['indication'].isin(PTX_indications)]['sample_id'].unique().tolist()
mutations = mutations[mutations['sample_id'].isin(Pts_w_PTX_indications)]
Pts_n_threshold = len(Pts_w_PTX_indications) * 0.035


mutations = mutations.sort_values('var_type')
mutations = mutations.drop_duplicates(subset = ['symbol', 'sample_id'], keep = 'first')

genes_mutated_in_many_pts = mutations.groupby('symbol')['symbol'].count() >= Pts_n_threshold
genes_mutated_in_many_pts = genes_mutated_in_many_pts[genes_mutated_in_many_pts].index.tolist()
genes_mutated_in_many_pts = mutations['symbol'].isin(genes_mutated_in_many_pts) & ((mutations['t_alt_frac'] < 0.8) | (mutations['var_type'] != 'LOF'))
mutations = mutations[~mutations['symbol'].isin(genes_mutated_in_many_pts)]

mutations = mutations[~mutations['response'].isna()]
mutations = mutations.loc[mutations['drug'].str.contains('paclitaxel', case=False)]

mutations = mutations[['symbol', 'variant_classification', 'sample_id', 'polyPhen', 'impact', 'response', 'var_type', 'response_group']]
mutations.to_csv('./src/data/mutationsFiltered.csv', index=False)

len(mutations.sample_id.unique())
mutations.shape
10349/184