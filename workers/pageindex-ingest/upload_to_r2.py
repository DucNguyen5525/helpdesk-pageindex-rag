from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import boto3


def upload_json_to_r2(key: str, payload: Any) -> str:
    account_id = _required("R2_ACCOUNT_ID")
    access_key_id = _required("R2_ACCESS_KEY_ID")
    secret_access_key = _required("R2_SECRET_ACCESS_KEY")
    bucket = _required("R2_BUCKET_NAME")
    public_base_url = os.getenv("R2_PUBLIC_BASE_URL")

    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )
    body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    client.put_object(Bucket=bucket, Key=key, Body=body, ContentType="application/json")

    if public_base_url:
        return f"{public_base_url.rstrip('/')}/{key}"
    return f"r2://{bucket}/{key}"


def upload_file_to_r2(key: str, file_path: str, content_type: str = "application/octet-stream") -> str:
    account_id = _required("R2_ACCOUNT_ID")
    access_key_id = _required("R2_ACCESS_KEY_ID")
    secret_access_key = _required("R2_SECRET_ACCESS_KEY")
    bucket = _required("R2_BUCKET_NAME")
    public_base_url = os.getenv("R2_PUBLIC_BASE_URL")
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )
    client.upload_file(str(Path(file_path).resolve()), bucket, key, ExtraArgs={"ContentType": content_type})
    if public_base_url:
        return f"{public_base_url.rstrip('/')}/{key}"
    return f"r2://{bucket}/{key}"


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value
