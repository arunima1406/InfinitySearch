import boto3
from google.cloud import storage
import os
from typing import Optional, BinaryIO
import uuid
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class CloudStorageService:
    def __init__(self):
        self.cloud_provider = settings.cloud_provider
        self._initialize_client()
    
    def _initialize_client(self):
        if self.cloud_provider == "aws":
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key
            )
            self.bucket_name = settings.s3_bucket_name
        elif self.cloud_provider == "gcp":
            self.gcs_client = storage.Client(project=settings.gcp_project_id)
            self.bucket_name = settings.gcs_bucket_name
        else:
            raise ValueError(f"Unsupported cloud provider: {self.cloud_provider}")
    
    def generate_upload_url(self, file_id: str, filename: str, content_type: str) -> str:
        """Generate pre-signed URL for direct upload from mobile app"""
        if self.cloud_provider == "aws":
            return self._generate_s3_presigned_url(file_id, filename, content_type)
        elif self.cloud_provider == "gcp":
            return self._generate_gcs_signed_url(file_id, filename, content_type)
    
    def _generate_s3_presigned_url(self, file_id: str, filename: str, content_type: str) -> str:
        """Generate S3 pre-signed URL for upload"""
        key = f"uploads/{file_id}/{filename}"
        
        url = self.s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': key,
                'ContentType': content_type
            },
            ExpiresIn=3600  # 1 hour
        )
        return url
    
    def _generate_gcs_signed_url(self, file_id: str, filename: str, content_type: str) -> str:
        """Generate GCS signed URL for upload"""
        bucket = self.gcs_client.bucket(self.bucket_name)
        blob = bucket.blob(f"uploads/{file_id}/{filename}")
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=3600,  # 1 hour
            method="PUT",
            content_type=content_type
        )
        return url
    
    def download_file(self, file_id: str, filename: str) -> bytes:
        """Download file from cloud storage"""
        if self.cloud_provider == "aws":
            key = f"uploads/{file_id}/{filename}"
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response['Body'].read()
        elif self.cloud_provider == "gcp":
            bucket = self.gcs_client.bucket(self.bucket_name)
            blob = bucket.blob(f"uploads/{file_id}/{filename}")
            return blob.download_as_bytes()
    
    def get_file_url(self, file_id: str, filename: str) -> str:
        """Get public URL for file"""
        if self.cloud_provider == "aws":
            return f"https://{self.bucket_name}.s3.amazonaws.com/uploads/{file_id}/{filename}"
        elif self.cloud_provider == "gcp":
            return f"https://storage.googleapis.com/{self.bucket_name}/uploads/{file_id}/{filename}"
    
    def delete_file(self, file_id: str, filename: str) -> bool:
        """Delete file from cloud storage"""
        try:
            if self.cloud_provider == "aws":
                key = f"uploads/{file_id}/{filename}"
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            elif self.cloud_provider == "gcp":
                bucket = self.gcs_client.bucket(self.bucket_name)
                blob = bucket.blob(f"uploads/{file_id}/{filename}")
                blob.delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False