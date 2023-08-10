import { getListS3 } from "../helpers/s3-helpers"

describe("smoke tests for DAP services", () => {
    // 	    // ******************** Copy files to s3 raw bucket ************************************
    
    
        test("Verify SQS Queue is reachable ", async () => {


        
        })
        test("Verify s3 Buckets are reachable ", async () => {

            const filesins3 = await getListS3('')
            expect(filesins3).not.toBeNull;
        
        })
        test("Verify Redshift Databse is reachable ", async () => {

            
        
        })
    })    