$uploadedFiles = $request->getUploadedFiles();

if( isset($uploadedFiles['my_file']) )
{
	$uploadedFile = $uploadedFiles['my_file'];
	if ($uploadedFile->getError() === UPLOAD_ERR_OK)
	{
		//$file = $request->getUploadedFiles()['my_file'];
		$file = $_FILES['my_file']['tmp_name'];
		$filename = $_FILES["my_file"]["name"];
		$extension = pathinfo($filename, PATHINFO_EXTENSION);
		
		$new_fileName = time()."_".$uid."_".$random_str.".".$extension;							
		$filepath = "app-data/office-auto/".$new_fileName;
		
		try
		{
			$result = $s3->putObject([
				'Bucket' => $s3BucketName,
				'Key'    => $filepath,
				'Body'   => fopen($file, 'r')
				
			]);
			
			$url = $result['ObjectURL'];
			
			#Let's also fetch the file by creating a temporary pre-signe url
			$cmd = $s3->getCommand('GetObject', [
				'Bucket' => $s3BucketName,
				'Key' => $filepath
			]);										
			$request = $s3->createPresignedRequest($cmd, '+720 minutes');//720 minutes = 12 Hrs (Max allowed by AWS)									
			$presigned_url = (string)$request->getUri();	
			
			$msg = "File uploaded";
			
		}
		catch (Aws\S3\Exception\S3Exception $e) {
			$msg =  "There was an error uploading the file.\n";
			$status = "0";
			$httpCode = 501;
			$zexaErrCode = 885671;
			$error = true;
		}								
		
	}
	else
	{
		$msg = "Error Code 44561: No file uploaded";
		$status = "0";
		$httpCode = 200;
		$proceed = false;
		$error = true;	
	}
}
else
{
	$msg = "Error Code 44562: No file uploaded";
	$status = "0";
	$httpCode = 200;
	$proceed = false;
	$error = true;	
}