import pytest
from unittest.mock import patch, MagicMock
from app.services.s3_service import S3Service

@patch("app.services.s3_service.boto3.client")
@pytest.mark.skip_ci
def test_upload_file(mock_client):
    mock_s3 = MagicMock()
    mock_client.return_value = mock_s3
    service = S3Service()
    service.bucket_name = "test-bucket"

    result = service.upload_file(b"test content", "file.pdf", "application/pdf")
    assert result["file_size"] == 12
    mock_s3.put_object.assert_called_once()
    args, kwargs = mock_s3.put_object.call_args
    assert kwargs["Bucket"] == "test-bucket"
    assert kwargs["Key"].startswith("uploads/")
    assert kwargs["ContentType"] == "application/pdf"

@patch("app.services.s3_service.boto3.client")
@pytest.mark.skip_ci
def test_get_presigned_url(mock_client):
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://test.url"
    mock_client.return_value = mock_s3
    service = S3Service()
    url = service.get_presigned_url("some/path")
    assert url == "https://test.url"
    mock_s3.generate_presigned_url.assert_called_once()