# Hướng dẫn sửa lỗi IAM Policy cho S3

## Vấn đề
IAM user `ept-mvp-uploader` hiện tại chỉ có quyền `s3:PutObject` (upload) nhưng không có quyền `s3:GetObject` (download), dẫn đến lỗi khi backend cố gắng tải file từ S3 để chấm điểm.

## Giải pháp

### Cách 1: Cập nhật IAM Policy (Khuyến nghị)

1. Đăng nhập vào AWS Console
2. Vào **IAM** → **Users** → `ept-mvp-uploader`
3. Tìm policy đang gắn cho user này
4. Cập nhật policy để thêm quyền `s3:GetObject`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::ept-mvp-assets/user-files/*"
    }
  ]
}
```

### Cách 2: Tạo Policy mới và gắn vào User

1. Vào **IAM** → **Policies** → **Create policy**
2. Chọn **JSON** và dán policy sau:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUploadAndDownload",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::ept-mvp-assets/user-files/*"
    }
  ]
}
```

3. Đặt tên policy: `EPT-S3-UserFiles-Access`
4. Tạo policy
5. Vào **Users** → `ept-mvp-uploader` → **Add permissions** → **Attach policies directly**
6. Chọn policy vừa tạo và attach

### Cách 3: Sử dụng IAM User khác (Nếu không thể sửa policy)

Nếu bạn có một IAM user khác có đủ quyền, cập nhật file `.env`:

```env
S3_ACCESS_KEY_ID=your_new_access_key_id
S3_SECRET_ACCESS_KEY=your_new_secret_access_key
```

## Kiểm tra

Sau khi sửa, restart backend server và thử lại. Lỗi `AccessDenied` sẽ không còn xuất hiện.






