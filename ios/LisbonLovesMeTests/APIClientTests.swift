import XCTest
@testable import LisbonLovesMe

final class APIClientTests: XCTestCase {
    override func setUp() {
        super.setUp()
        URLProtocol.registerClass(MockURLProtocol.self)
    }

    override func tearDown() {
        URLProtocol.unregisterClass(MockURLProtocol.self)
        MockURLProtocol.requestHandler = nil
        super.tearDown()
    }

    func testFetchTestimonials_ApprovedOnlyTrue_AppendsQueryAndDecodes() async throws {
        let expected = [
            Testimonial(id: 1, customerName: "Jane", customerCountry: "PT", rating: 5, text: "Amazing!", tourId: 11, isApproved: true)
        ]

        MockURLProtocol.requestHandler = { request in
            // Assert path + query
            XCTAssertEqual(request.url?.path, "/api/testimonials")
            XCTAssertEqual(request.url?.query, "approvedOnly=true")

            let data = try JSONEncoder().encode(expected)
            let resp = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            return (resp, data)
        }

        let items = try await APIClient.shared.fetchTestimonials(approvedOnly: true)
        XCTAssertEqual(items.count, 1)
        XCTAssertEqual(items.first?.customerName, "Jane")
        XCTAssertEqual(items.first?.rating, 5)
        XCTAssertEqual(items.first?.isApproved, true)
    }

    func testFetchTestimonials_ApprovedOnlyFalse_AppendsFalseAndDecodes() async throws {
        let expected = [
            Testimonial(id: 2, customerName: "John", customerCountry: "US", rating: 4, text: "Great tour", tourId: 22, isApproved: nil)
        ]

        MockURLProtocol.requestHandler = { request in
            // Assert path + query contains approvedOnly=false
            XCTAssertEqual(request.url?.path, "/api/testimonials")
            XCTAssertEqual(request.url?.query, "approvedOnly=false")

            let data = try JSONEncoder().encode(expected)
            let resp = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            return (resp, data)
        }

        let items = try await APIClient.shared.fetchTestimonials(approvedOnly: false)
        XCTAssertEqual(items.count, 1)
        XCTAssertEqual(items.first?.customerName, "John")
        XCTAssertEqual(items.first?.rating, 4)
        XCTAssertNil(items.first?.isApproved)
    }
}

// MARK: - Mock URLProtocol
final class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        // Intercept all HTTP/HTTPS requests
        return true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
    }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            client?.urlProtocol(self, didFailWithError: URLError(.badServerResponse))
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() { }
}
