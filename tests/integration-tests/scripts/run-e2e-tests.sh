Outputs:
  TXMA_QueueURL:
    Description: 'TxMA queue URL'
    Value: !Ref EventConsumerQueue

    TXMA_BUCKET:
      Description: 'Name of raw bucket'
      Value: !Ref RawLayerBucket

Parameters:
  Environment:
    Description: Environment type
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - feature
      - build
      - staging
      - integration
      - production
  CodeSigningConfigArn:
    Description: ARN of Code Signing Config from deployment pipeline
    Type: String
    Default: none
  PermissionsBoundary:
    Description: ARN of permissions boundary for new roles
    Type: String
    Default: none
  DeliveryStreamName:
    Description: Kinesis Firehose delivery stream name
    Type: String
    Default: dap-txma-delivery-stream
  RawGlueDatabaseName:
    Default: txma-raw
    Type: String
    Description: Name for the TxMA Raw Glue database
  StageGlueDatabaseName:
    Default: txma-stage
    Type: String
    Description: Name for the TxMA Stage Glue database
  BuildAccountId:
    Default: 991664831801
    Type: String
    Description: Account number of the build account used to grant it S3 access in other accounts
    AllowedValues:
      - 991664831801

Conditions:
  UseCodeSigning: !Not
    - !Equals
      - !Ref CodeSigningConfigArn
      - none
  UsePermissionsBoundary: !Not
    - !Equals
      - !Ref PermissionsBoundary
      - none
  IsTest: !Equals [!Ref Environment, test]
  IsFeature: !Equals [!Ref Environment, feature]
  IsDev: !Equals [!Ref Environment, dev]
  IsBuild: !Equals [!Ref Environment, build]
  IsStaging: !Equals [!Ref Environment, staging]
  IsProduction: !Equals [!Ref Environment, production]
  UsePlaceholderTxMAQueue: !Or
    - !Condition IsTest
    - !Condition IsFeature
    # todo replace line below with `- !Condition IsDev` when txma queue has been moved from dev to staging
    - !Condition IsStaging
    - !Condition IsBuild

Globals:
  Function:
    CodeSigningConfigArn: !If
      - UseCodeSigning
      - !Ref CodeSigningConfigArn
      - !Ref 'AWS::NoValue'
    PermissionsBoundary: !If
      - UsePermissionsBoundary
      - !Ref PermissionsBoundary
      - !Ref 'AWS::NoValue'
    Runtime: nodejs18.x
    Timeout: 30
    CodeUri: dist/
    Environment:
      Variables:
        NODE_OPTIONS: '--enable-source-maps'
