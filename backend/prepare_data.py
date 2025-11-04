# prepare_data.py
import json
import os
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split
import argparse

def load_jsonl(path):
    rows = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows

def main(infile, outdir, test_size=0.1, val_size=0.05, seed=42):
    os.makedirs(outdir, exist_ok=True)
    rows = load_jsonl(infile)
    prompts = [r['prompt'] for r in rows]
    responses = [r['response'] for r in rows]
    data = {'prompt': prompts, 'response': responses}
    dataset = Dataset.from_dict(data)

    # Train / temp (test+val)
    train_test = dataset.train_test_split(test_size=test_size + val_size, seed=seed)
    # Now split the temp into val & test proportional
    temp = train_test['test']
    if val_size > 0:
        rel_val = val_size / (test_size + val_size)
        tv = temp.train_test_split(test_size=rel_val, seed=seed)
        ds = DatasetDict({
            'train': train_test['train'],
            'validation': tv['test'],
            'test': tv['train']
        })
    else:
        ds = DatasetDict({
            'train': train_test['train'],
            'validation': Dataset.from_dict({'prompt':[], 'response':[]}),
            'test': train_test['test']
        })
    ds.save_to_disk(outdir)
    print("Saved HF dataset to", outdir)
    print("Train size:", len(ds['train']), "Val size:", len(ds['validation']), "Test size:", len(ds['test']))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--infile", default="data/sample_dataset.jsonl")
    parser.add_argument("--outdir", default="data/hf_dataset")
    args = parser.parse_args()
    main(args.infile, args.outdir)