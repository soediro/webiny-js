import * as aws from "@pulumi/aws";

class Delivery {
    bucket: aws.s3.Bucket;
    cloudfront: aws.cloudfront.Distribution;
    constructor({ appS3Bucket }: { appS3Bucket: aws.s3.Bucket }) {
        this.bucket = new aws.s3.Bucket("delivery", {
            acl: "public-read",
            website: {
                indexDocument: "index.html",
                errorDocument: "_NOT_FOUND_PAGE_/index.html"
            }
        });

        this.cloudfront = new aws.cloudfront.Distribution("delivery", {
            enabled: true,
            waitForDeployment: false,
            origins: [
                {
                    originId: this.bucket.arn,
                    domainName: this.bucket.websiteEndpoint,
                    customOriginConfig: {
                        originProtocolPolicy: "http-only",
                        httpPort: 80,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"]
                    }
                },
                {
                    originId: appS3Bucket.arn,
                    domainName: appS3Bucket.websiteEndpoint,
                    customOriginConfig: {
                        originProtocolPolicy: "http-only",
                        httpPort: 80,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"]
                    }
                }
            ],
            orderedCacheBehaviors: [
                {
                    allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    forwardedValues: {
                        cookies: {
                            forward: "none"
                        },
                        headers: [],
                        queryString: false
                    },
                    pathPattern: "/static/*",
                    viewerProtocolPolicy: "allow-all",
                    targetOriginId: appS3Bucket.arn
                }
            ],
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                targetOriginId: this.bucket.arn,
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD", "OPTIONS"],
                forwardedValues: {
                    cookies: { forward: "none" },
                    queryString: false
                },
                minTtl: 0,
                defaultTtl: 600,
                maxTtl: 600
            },
            priceClass: "PriceClass_100",
            restrictions: {
                geoRestriction: {
                    restrictionType: "none"
                }
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true
            }
        });
    }
}

export default Delivery;